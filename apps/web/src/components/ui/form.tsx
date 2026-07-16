import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import type { AnyFieldApi } from "@tanstack/react-form"
import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldContextValue {
  field: AnyFieldApi
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

/** Compatibility wrapper used while forms share the project's field UI. */
function Form({ children }: { children?: React.ReactNode }) {
  return children
}

interface FormFieldProps {
  // TanStack Form's React-enhanced form API has a generic Field component whose
  // full type depends on every validator. This boundary intentionally erases
  // those generics while each useForm call retains its inferred value type.
  // SAFETY: every caller passes the form returned by @tanstack/react-form useForm.
  control: any
  name: string
  render: (props: {
    field: {
      name: string
      value: any
      onBlur: () => void
      onChange: (value: any) => void
    }
    fieldState: { invalid: boolean }
  }) => React.ReactNode
}

/** Connects a TanStack Form field to the shared form presentation components. */
function FormField({ control, name, render }: FormFieldProps) {
  return (
    <control.Field name={name}>
      {(field: AnyFieldApi) => (
        <FormFieldContext.Provider value={{ field }}>
          {render({
            field: {
              name,
              value: field.state.value,
              onBlur: field.handleBlur,
              onChange: (value) => {
                if (
                  typeof value === "object" &&
                  value !== null &&
                  "target" in value
                ) {
                  field.handleChange(value.target.value)
                  return
                }
                field.handleChange(value)
              },
            },
            fieldState: { invalid: field.state.meta.errors.length > 0 },
          })}
        </FormFieldContext.Provider>
      )}
    </control.Field>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext || !itemContext) {
    throw new Error("useFormField must be used within FormField and FormItem")
  }

  const { field } = fieldContext
  const { id } = itemContext

  return {
    id,
    name: field.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: field.state.meta.errors[0],
  }
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()
  return (
    <Label
      data-slot="form-label"
      data-error={Boolean(error)}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl(props: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={Boolean(error)}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()
  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error
    ? typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : String(error)
    : props.children

  if (!body) return null

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
