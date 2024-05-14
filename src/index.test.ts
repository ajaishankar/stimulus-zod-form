import { Application } from "@hotwired/stimulus";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/dom";
import { z } from "zod";
import { FieldController, FormController } from "./index";

const getTextContent = (testId: string) => screen.getByTestId(testId).textContent;

const setValue = (testId: string, value: string) => fireEvent.change(screen.getByTestId(testId), { target: { value } });

const schema = z
  .object({
    name: z.string().min(1),
    email: z.string().email("invalid_email"),
    addresses: z.array(
      z.object({
        city: z.string().min(1, "City is required"),
      })
    ),
  })
  .refine((data) => data.name === "Homer", {
    message: "Expecting Homer",
  });

class TestFormController extends FormController(schema) {
  submitted = false;

  submit(event: SubmitEvent) {
    event.preventDefault();

    this.submitted = true;
    return super.submit({
      preventDefault: () => (this.submitted = false),
    } as any);
  }
}

function field(name: string, value?: string) {
  return `
    <div data-controller="field" class="form-field">
      <input data-testId="${name}" name="${name}" value="${value ?? ""}"
        data-field-target="input"
        data-action="blur->field#validate" />
      <div data-testid="${name}-error" data-field-target="error"></div>
    </div>
  `;
}

const html = `
  <form id="form"
    data-controller="form"
    data-form-field-outlet=".form-field"
    data-action="form#submit"
    data-form-error-map-value='{ "invalid_email": "correo inválido" }'>
    <div data-testid="form-error" data-form-target="error"></div>
    ${field("name")}
    ${field("email")}
    ${field("addresses[0].city")}
    ${field("addresses[1].city", "Springfield")}
    <button type="submit">Submit</button>
  </form>
`;

describe("stimulus zod form", () => {
  let application: Application;

  function getFormController(identifier = "form") {
    return application.getControllerForElementAndIdentifier(
      document.querySelector(`#${identifier}`)!,
      identifier
    ) as TestFormController;
  }

  beforeEach(() => {
    document.body.innerHTML = html;
    application = Application.start();
    application.register("form", TestFormController);
    application.register("field", FieldController);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should set errors for invalid form", () => {
    fireEvent(screen.getByText("Submit"), new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(getTextContent("form-error")).toBe("Expecting Homer");
    expect(getTextContent("name-error")).toBe("String must contain at least 1 character(s)");
    expect(getTextContent("email-error")).toBe("correo inválido");
    expect(getTextContent("addresses[0].city-error")).toBe("City is required");
    expect(getTextContent("addresses[1].city-error")).toBe("");
  });

  it("should not submit invalid form", () => {
    const form = getFormController();
    fireEvent(screen.getByText("Submit"), new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(form.submitted).toBe(false);
  });

  it("should translate error from error map", () => {
    fireEvent(screen.getByText("Submit"), new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(getTextContent("email-error")).toBe("correo inválido");
  });

  it("should clear errors for valid form", () => {
    setValue("name", "Homer");
    setValue("email", "homer@thesimpsons.com");
    setValue("addresses[0].city", "Springfield");

    fireEvent(screen.getByText("Submit"), new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(getTextContent("form-error")).toBe("");
    expect(getTextContent("name-error")).toBe("");
    expect(getTextContent("email-error")).toBe("");
    expect(getTextContent("addresses[0].city-error")).toBe("");
    expect(getTextContent("addresses[1].city-error")).toBe("");
  });

  it("should submit valid form", () => {
    const form = getFormController();

    setValue("name", "Homer");
    setValue("email", "homer@thesimpsons.com");
    setValue("addresses[0].city", "Springfield");

    fireEvent(screen.getByText("Submit"), new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(form.submitted).toBe(true);
  });

  it("should set field error only if touched", async () => {
    fireEvent.blur(screen.getByTestId("email"));
    expect(getTextContent("email-error")).toBe("correo inválido");
    expect(getTextContent("name-error")).toBe("");
  });

  it("should always set form error", async () => {
    fireEvent.blur(screen.getByTestId("email"));
    expect(getTextContent("form-error")).toBe("Expecting Homer");
  });
});
