import { Controller } from "@hotwired/stimulus";

type Validator = { validate: () => boolean };

/**
 * ```ts
 * <div data-controller="field" class="form-field">
 *   <input name="addresses[0].city"
 *     data-field-target="input"
 *     data-action="blur->field#validate" />
 *   <div data-field-target="error"></div>
 * </div>
 * ```
 */
export default class FieldController<T extends Element = Element> extends Controller<T> {
  static targets = ["input", "error"];

  private touched = false;
  private validator?: Validator;

  errorTargetConnected(element: Element) {
    /* istanbul ignore next */
    this.touched = !!element.textContent?.trim();
  }

  errorTargetDisconnected() {
    this.touched = false;
  }

  /**
   * Called by ZodFormController when field outlet is connected or disconnected
   */
  setValidator(validator: Validator | undefined) {
    this.validator = validator;
  }

  validate() {
    if (this.validator != null) {
      this.setTouched();
      this.validator.validate();
    }
  }

  setTouched() {
    this.touched = true;
  }

  getName() {
    if (this.hasInputTarget) return this.inputTarget.getAttribute("name");
  }

  setError(message: string) {
    if (this.touched && this.hasErrorTarget) this.errorTarget.textContent = message;
  }

  clearError() {
    if (this.hasErrorTarget) this.errorTarget.textContent = "";
  }

  declare hasInputTarget: boolean;
  declare hasErrorTarget: boolean;
  declare inputTarget: Element;
  declare errorTarget: Element;
}
