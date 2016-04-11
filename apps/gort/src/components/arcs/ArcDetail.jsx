
import React from "react";
import twixty from "twixtykit";

import SK from "../../SK";
import style from "./ArcDetail.scss";

export default class ArcDetail extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = "ArcDetail";
    this.state = {
      vertices: [],
      arc: {
        kind: "arc",
        from: {},
        to: {},
        delay: 0
      },
    };
  }
  componentDidMount() {
    this.doSubscriptions(this.props);
  }
  componentWillReceiveProps(newProps) {
    if (newProps.arcId === this.props.arcId) {
      return;
    }
    if (this.vertexHandle) {
      this.vertexHandle.stop();
    }
    if (this.arcHandle) {
      this.arcHandle.stop();
    }
    this.doSubscriptions(newProps);
  }
  doSubscriptions(props) {
    this.vertexHandle = SK.vertices.watch(props.broadcastId)
    .on("data", (vertices) => {
      this.setState({vertices});
    })
    .catch((...args) => {
      twixty.error(...args);
    });
    if (props.create !== true) {
      if (!props.arcId) {
        throw new Error("ArcDetail called with create false but no arcId.");
      }
      this.arcHandle = SK.arcs.watch({id: props.arcId})
      .then((arcs) => {
        this.setState({initialDelay: arcs[0].delay})
      })
      .on("data", (arcs) => {
        this.setState({arc: arcs[0]});
      })
      .catch((err) => {
        twixty.error(err);
      });
    }

    // this.arcHandle = SK.arcs.watch({broadcastId})
    // .on("data", (arcs) => {
    //   this.setState({arcs});
    // })
    // .catch((...args) => {
    //   twixty.error(...args);
    // });
  }
  componentWillUnmount() {
    // this.arcHandle.stop();
    this.vertexHandle.stop();
    if (this.arcHandle) {
      this.arcHandle.stop();
    }
  }

  makeList(direction) {
    const ret = [];
    // Ehhhhhhhhhhhhh
    let vertexField;
    let arcField;
    if (direction === "from") {
      vertexField = "outputs";
      arcField = "output";
    }
    else if (direction === "to") {
      vertexField = "inputs";
      arcField = "input";
    }
    this.state.vertices.forEach((v) => {
      Object.keys(v[vertexField]).forEach((name) => {
        const onClick = () => {
          const newArc = {...this.state.arc};
          newArc[direction] = {
            vertexId: v.id,
            [arcField]: name
          };
          this.setState({arc: newArc});
          this.props.onChange(newArc);
        };
        let className = style.ArcListItem;
        if (this.state.arc[direction].vertexId === v.id && name === this.state.arc[direction][arcField]) {
          className = style.ArcListItemSelected;
        }
        const key = v.id + name;
        ret.push(
          <div key={key} className={className} onClick={onClick}>
            <span className={style.ArcListItemTitle}>{v.title}</span>
            <span className={style.ArcListItemDetails}>{name}</span>
          </div>
        );
      });
    });
    return ret;
  }

  handleChange(field, e) {
    const newArc = {...this.state.arc};
    newArc[field] = e.target.value;
    if (field === "delay") {
      this.setState({initialDelay: e.target.value});
    }
    this.setState({arc: newArc});
    newArc.delay = e.target.value;
    this.props.onChange(newArc);
  }

  render() {
    if (!this.state.arc) {
      return <br />;
    }
    return (
      <section>
        <section className={style.ArcPicker}>
          <div className={style.ArcFrom}>
            {this.makeList("from")}
          </div>
          <div className={style.ArcPointer}>
            <span className="fa fa-caret-square-o-right" />
          </div>
          <div className={style.ArcTo}>
            {this.makeList("to")}
          </div>
        </section>
        <div>
          <p>Delay: <input value={this.state.initialDelay} onChange={this.handleChange.bind(this, "delay")} /></p>
        </div>
      </section>
    );
  }
}

ArcDetail.propTypes = {
  broadcastId: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired,
  create: React.PropTypes.bool,
  arcId: React.PropTypes.string,
};