import { Component, PureComponent } from "react";

type Props = { size?: "sm" | "lg"; label: string };

export class A7 extends Component<Props> {
  static defaultProps = { size: "sm" };

  render() {
    return <span>{this.props.label}</span>;
  }
}

export class A7Pure extends PureComponent<Props> {
  render() {
    return <span>{this.props.label}</span>;
  }
}
