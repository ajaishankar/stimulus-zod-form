# Stimulus Zod Form

### Stimulus Zod Validated Form

For the ten people on earth who want to use [Zod](https://zod.dev/) with [Stimulus](https://stimulus.hotwired.dev/) for client side validation.

This package was inspired by [Remix Validated Form](https://www.remix-validated-form.io/) but a whole lot simpler thanks to Stimulus!

### Usage

Define your schema and register the controllers

```ts
import { Application } from "@hotwired/stimulus"
import { FormController, FieldController } from "stimulus-zod-form";
import { z } from "zod";

const PersonSchema = z.object({
  name: z.string().min(3),
  email: z.string().email("invalid_email"),
  addresses: z.array(z.object({ city: z.string() }))
})

const PersonFormController = FormController(PersonSchema);

window.Stimulus = Application.start();
Stimulus.register("form", PersonFormController);
Stimulus.register("field", FieldController);
```

Let the controllers spring to life!

```html
<form data-controller="form"
  data-form-field-outlet=".form-field"
  data-action="form#submit"
  data-form-error-map-value='{ "invalid_email": "correo inválido", ... }'>

  <div data-form-target="error"></div>

  <div data-controller="field" class="form-field">
   <input name="addresses[0].city"
     data-field-target="input"
     data-action="blur->field#setTouched blur->form#validate" />
   <div data-field-target="error"></div>
  </div>
</form>
```

### Summary

In the sample code above note the following

* Form field outlets `data-form-field-outlet`
* Form validate on submit `data-action="form#submit"`
* Field validate on blur `data-action="blur->field#setTouched blur->form#validate"`
* Field input target `data-field-target="input"`
* Field error target `data-field-target="error"`
* Form error target ` data-form-target="error"`
* Error localization `data-form-error-map-value`
