function formInputVal(formId, inputName) {
  return $("#" + formId).find("input[name='" + inputName + "']").val();
}

function setDiv(divId, value) {
  $("#" + divId).html(value);
}
