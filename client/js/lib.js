import VALIDATION_METHODS from './validation.js'

/**
 * Performs validation checks on input fields within a fieldset element
 * @param {HTMLFieldSetElement} el - Fieldset element
 * @param {FormValues} formData - current form values
 */
export function isValidFieldset(el, formData) {
  const inputs = el.getElementsByTagName('input')
  let isValidFieldset = true

  for (let i = 0; i < inputs.length; i++) {
    const fieldName = inputs[i].name
    if (
      VALIDATION_METHODS[fieldName] &&
      !VALIDATION_METHODS[fieldName](formData[fieldName]).valid
    )
      isValidFieldset = false
  }

  return isValidFieldset
}

/**
 * Displays error messages on descendant input elements
 * @param {HTMLFieldSetElement} el - Element to be checked for errors
 * @param {HTMLFormElement} formRef - Enclosing form element
 */
export function displayErrorMessagesWithin(el, formRef, formFields) {
  const inputs = el.getElementsByTagName('input')
  const errorMessages = el.getElementsByClassName('error-message')

  const formData = getCurrentFormValues(formRef, formFields)
  for (let i = 0; i < inputs.length; i++) {
    const requiresValidation = VALIDATION_METHODS[inputs[i].name] !== undefined
    const validationResult =
      requiresValidation &&
      VALIDATION_METHODS[inputs[i].name](formData[inputs[i].name])
    const errorMessageRef = inputs[i].nextElementSibling
    if (
      !validationResult.valid &&
      errorMessageRef !== null &&
      errorMessageRef.classList.contains('error-message')
    ) {
      errorMessageRef.hidden = false
      errorMessageRef.innerHTML = validationResult.message
      inputs[i].addEventListener('input', () => {
        const updatedForm = getCurrentFormValues(formRef, formFields)
        const isNowValid = VALIDATION_METHODS[inputs[i].name](
          updatedForm[inputs[i].name],
        ).valid

        if (isNowValid) errorMessageRef.hidden = true
      })
    }

    if (!isValidFieldset(el, formData)) {
      el.classList.add('invalid-field-warning')
      if (
        errorMessages.length === 1 &&
        errorMessages[0].previousElementSibling &&
        errorMessages[0].previousElementSibling.tagName !== 'INPUT'
      )
        errorMessages[0].hidden = false
    }

    el.addEventListener('input', () => {
      if (isValidFieldset(el, getCurrentFormValues(formRef, formFields)))
        el.classList.remove('invalid-field-warning')
      if (
        errorMessages.length === 1 &&
        errorMessages[0].previousElementSibling &&
        errorMessages[0].previousElementSibling.tagName !== 'INPUT'
      )
        errorMessages[0].hidden = true
    })
  }
}

/**
 * Returns form values in a JS object
 * @param {HTMLFormElement} formRef - HTMLFormElement
 * @returns {FormValues} JS object containing form values
 */
export function getCurrentFormValues(formRef, formFields) {
  const data = new FormData(formRef)
  formFields = structuredClone(formFields)

  for (const [name, value] of data) {
    if (typeof formFields[name] === 'object') {
      formFields[name][value] = true
      continue
    }

    formFields[name] = value === 'true' || value
  }

  return formFields
}

/**
 * Attempts to submit the form if all fields are valid
 * @param {Event} event
 * @param {HTMLFormElement} formRef
 */
export function validateAndSubmit(event, formRef, formFields) {
  event.preventDefault()

  const formValues = getCurrentFormValues(formRef, formFields)
  let isValid = true
  const fieldsets = formRef.getElementsByTagName('fieldset')
  for (let i = 0; i < fieldsets.length; i++) {
    if (!isValidFieldset(fieldsets[i], formValues)) {
      displayErrorMessagesWithin(fieldsets[i], formRef, formFields)
      isValid && fieldsets[i].scrollIntoView({ behavior: 'smooth' })
      isValid = false
    }
  }

  if (isValid) formRef.requestSubmit()
}
