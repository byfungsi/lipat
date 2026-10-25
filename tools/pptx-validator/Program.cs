using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
if (args.Length == 0) throw new ArgumentException("Provide one or more PPTX paths");
var count = 0;
foreach (var path in args) {
    using var document = PresentationDocument.Open(path, false);
    var errors = new OpenXmlValidator().Validate(document).ToList();
    foreach (var error in errors) Console.Error.WriteLine($"{path}: {error.Part?.Uri} {error.Path?.XPath}: {error.Description}");
    count += errors.Count;
    Console.WriteLine($"{path}: {errors.Count} Open XML validation errors");
}
Environment.ExitCode = count == 0 ? 0 : 1;
