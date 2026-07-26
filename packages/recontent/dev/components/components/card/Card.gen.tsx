import type { ComponentPropsWithoutRef } from "react";
import {
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardRoot,
  cardTitle,
} from "./Card.gen.css";

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type CardProps = ComponentPropsWithoutRef<"div">;
export type CardHeaderProps = ComponentPropsWithoutRef<"div">;
export type CardTitleProps = ComponentPropsWithoutRef<"div">;
export type CardDescriptionProps = ComponentPropsWithoutRef<"div">;
export type CardContentProps = ComponentPropsWithoutRef<"div">;
export type CardFooterProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return <div data-slot="card" {...props} className={classes(cardRoot, className)} />;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div data-slot="card-header" {...props} className={classes(cardHeader, className)} />;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <div data-slot="card-title" {...props} className={classes(cardTitle, className)} />;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <div data-slot="card-description" {...props} className={classes(cardDescription, className)} />;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div data-slot="card-content" {...props} className={classes(cardContent, className)} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div data-slot="card-footer" {...props} className={classes(cardFooter, className)} />;
}
