function FormatError(field, item, message = 'format error') {
  this.field = field;
  this.message = message;
  this.raw = item.raw;
}

module.exports = FormatError;
