import { Context, Controller } from "@hotwired/stimulus";
import { ZodIssue, ZodType, z } from "zod";
import FieldController from "./field-controller";

const isIndex = (key: string) => !isNaN(parseInt(key));

/**
 * Tokenizes addresses[0].city to ['addresses', '0', 'city']
 */
function tokenize(path: string) {
  return path
    .trim()
    .replace(/\[(\w+)\]/g, ".$1") // [foo] to .foo
    .replace(/^\.|\.$/, "") // trim('.')
    .split(".");
}

function getPath(nameOrPath: string | (string | number)[]) {
  const tokens = typeof nameOrPath === "string" ? tokenize(nameOrPath) : nameOrPath;
  return tokens.join(".");
}

/**
 * Deeply sets value for a path (target, 'addresses[0].city', 'Springfield')
 */
function set(target: Record<string, any>, path: string, value: unknown) {
  const tokens = tokenize(path);

  tokens.forEach((cur, i) => {
    const next = tokens[i + 1];
    if (next == null) {
      target[cur] = value;
    } else {
      target = target[cur] = target[cur] || (isIndex(next) ? [] : {});
    }
  });
}

type ValidationSuccess<Schema extends ZodType> = { success: true; data: z.infer<Schema> };

type ValidationError = { success: false; issues: ZodIssue[] };

type ValidationResult<Schema extends ZodType> = ValidationSuccess<Schema> | ValidationError;

class ZodFormController<Schema extends ZodType> extends Controller<HTMLFormElement> {
  static values = { errorMap: Object };
  static outlets = ["field"];
  static targets = ["error"];

  private fields = new Map<string, FieldController>();

  protected constructor(
    context: Context,
    protected schema: Schema
  ) {
    super(context);
  }

  fieldOutletConnected(field: FieldController) {
    const name = field.getName();
    if (name) {
      this.fields.set(getPath(name), field);
      field.setValidator(this);
    }
  }

  fieldOutletDisconnected(field: FieldController) {
    const name = field.getName();
    if (name) {
      this.fields.delete(getPath(name));
      field.setValidator(undefined);
    }
  }

  submit(event: SubmitEvent) {
    const { success } = this.validateSchema(true);
    if (!success) {
      event.preventDefault();
    }
    return success;
  }

  validate() {
    const { success } = this.validateSchema(false);
    return success;
  }

  protected validateSchema(isFormSubmitting: boolean): ValidationResult<Schema> {
    if (isFormSubmitting) this.fields.forEach((field) => field.setTouched());

    const data = {};

    for (const [path, value] of new FormData(this.element).entries()) {
      set(data, path, value);
    }

    const result = this.schema.safeParse(data);

    if (result.success) {
      this.clearErrors();
      return { success: true, data: result.data } as const;
    } else {
      // translate messages manually - custom error map message override does not work yet
      // https://github.com/colinhacks/zod/issues/2940
      const issues = result.error.issues.map((issue) => ({
        ...issue,
        message: this.errorMapValue[issue.message] ?? issue.message,
      }));
      this.setErrors(issues);
      return { success: false, issues } as const;
    }
  }

  private clearErrors() {
    if (this.hasErrorTarget) this.errorTarget.textContent = "";
    this.fields.forEach((field) => field.clearError());
  }

  private setErrors(issues: ZodIssue[]) {
    const errors = new Map<string, string>(); // Map<path, message>

    errors.set("", ""); // top level form error
    issues.forEach((issue) => errors.set(getPath(issue.path), issue.message));

    if (this.hasErrorTarget) this.errorTarget.textContent = errors.get("")!;

    this.fields.forEach((field, path) => {
      const message = errors.get(path);
      if (message) {
        field.setError(message);
      } else {
        field.clearError();
      }
    });
  }

  declare hasErrorTarget: boolean;
  declare errorTarget: Element;
  declare errorMapValue: Record<string, string>;
}

type FormControllerConstructor<S extends ZodType> = new (context: Context) => ZodFormController<S>;

/**
 * ```ts
 * const schema = z.object({
 *   email: z.string().email("invalid_email"),
 *   addresses: z.array(z.object({ city: z.string() }))
 * })
 *
 * <form data-controller="form"
 *   data-form-field-outlet=".form-field"
 *   data-action="form#submit"
 *   data-form-error-map-value='{ "invalid_email": "correo inválido", ... }'>
 *
 *   <div data-form-target="error"></div>
 *
 *   <div data-controller="field" class="form-field">
 *    <input name="addresses[0].city"
 *      data-field-target="input"
 *      data-action="blur->field#validate" />
 *    <div data-field-target="error"></div>
 *   </div>
 * </form>
 * ```
 */
export default function FormController<Schema extends ZodType>(schema: Schema): FormControllerConstructor<Schema> {
  return class extends ZodFormController<Schema> {
    constructor(context: Context) {
      super(context, schema);
    }
  };
}
