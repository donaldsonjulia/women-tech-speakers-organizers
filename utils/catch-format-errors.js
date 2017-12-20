function catchFormatErrors(data) {
  const allErrors = [];

  data.forEach((person) => {
    if (person.meta.formatErrors.length > 0 || person.meta.unknownFields.length > 0) {
      const errorSummary = {
        type: person.type,
        person: person.attributes.name,
        formatErrors: person.meta.formatErrors,
        unknownFields: person.meta.unknownFields,
      };

      allErrors.push(errorSummary);
    }
  });

  if (allErrors.length > 0) {
    throw new Error(`Errors found while parsing README: ${JSON.stringify(allErrors)}`);
  }
}

module.exports = catchFormatErrors;
