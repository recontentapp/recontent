export function generateRenderElementSource(): string {
  return `import { cloneElement } from "react";
import type { AriaAttributes, ComponentPropsWithoutRef, ElementType, FocusEventHandler, ReactElement } from "react";

export interface CommonComponentProps extends AriaAttributes {
  className?: string;
  id?: string;
  "data-testid"?: string;
  [key: \`data-\${string}\`]: string | number | boolean | undefined;
}

export type RenderProp<DefaultElement extends ElementType = "div"> =
  | ReactElement
  | ((props: ComponentPropsWithoutRef<DefaultElement>) => ReactElement);

/**
 * Shared by every form control that can sit inside a \`Field\`. \`Field\` owns
 * the label, description and error copy; controls only report their own
 * state so they can style themselves and wire up \`aria-invalid\` /
 * \`aria-describedby\`.
 */
export interface FieldableInputProps {
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  onFocus?: FocusEventHandler;
  onBlur?: FocusEventHandler;
}

/**
 * Renders \`Tag\` with \`props\`, or defers to \`render\` (a Base UI-style escape
 * hatch) when the consumer wants to swap the rendered element.
 */
export function renderElement<DefaultElement extends ElementType>(
  Tag: DefaultElement,
  render: RenderProp<DefaultElement> | undefined,
  props: ComponentPropsWithoutRef<DefaultElement>,
): ReactElement {
  if (typeof render === "function") {
    return render(props);
  }
  if (render) {
    const renderProps = render.props as Record<string, unknown>;
    const className = [(props as Record<string, unknown>).className, renderProps.className]
      .filter(Boolean)
      .join(" ");
    return cloneElement(render, {
      ...props,
      ...renderProps,
      ...(className ? { className } : {}),
    });
  }
  // Tag is dynamic (a generic ElementType), so its prop shape can't be
  // resolved statically here; callers own the public, strongly-typed props.
  const Element = Tag as ElementType;
  return <Element {...(props as Record<string, unknown>)} />;
}
`;
}

import type { InternalModuleDefinition } from "../types.js";

export const renderElementModule: InternalModuleDefinition = {
  id: "render-element",
  output: {
    runtimeDependencies: { react: ">=18" },
    generate: () => [
      {
        filename: "renderElement.gen.tsx",
        content: generateRenderElementSource(),
      },
    ],
  },
};
