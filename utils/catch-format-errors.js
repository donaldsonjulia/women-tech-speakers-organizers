function catchFormatErrors(data) {
  const allErrors = [];

  data.forEach((person) => {
    if (person.meta.formatErrors.length > 0) {
      const errorSummary = {
        name: person.attributes.name,
        type: person.type,
        errors: person.meta.formatErrors,
      };

      allErrors.push(errorSummary);
    }
  });

  if (allErrors.length > 0) {
    allErrors.forEach((errSummary) => {
      console.error('FORMAT ERROR', errSummary);
    });
    // throw new Error(`Errors found while parsing README: ${JSON.stringify(allErrors)}`);
    throw new Error('Format errors or unknown fields found while parsing README');
  }
}

module.exports = catchFormatErrors;
