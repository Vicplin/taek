using System.Net.Http.Headers;

namespace Taek.Api.Services;

public class SupabaseStorageService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    };

    private const long MaxBytes = 5 * 1024 * 1024; // 5MB

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public SupabaseStorageService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public async Task<string> UploadAsync(string bucket, string objectPath, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > MaxBytes)
            throw new InvalidOperationException("File must be between 1 byte and 5MB.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new InvalidOperationException($"File type '{file.ContentType}' is not allowed.");

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, cancellationToken);
        ms.Position = 0;

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", ServiceKey);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ServiceKey);

        var uploadUrl = $"{SupabaseUrl}/storage/v1/object/{bucket}/{objectPath}";

        var byteContent = new ByteArrayContent(ms.ToArray());
        byteContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

        var response = await client.PostAsync(uploadUrl, byteContent, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Storage upload failed: {error}");
        }

        // Return public URL
        return $"{SupabaseUrl}/storage/v1/object/public/{bucket}/{objectPath}";
    }
}