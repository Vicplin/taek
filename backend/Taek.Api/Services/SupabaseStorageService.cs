namespace Taek.Api.Services;

public class SupabaseStorageService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "application/pdf"
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    private readonly Supabase.Client _supabase;

    public SupabaseStorageService(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    public async Task<string> UploadAsync(string bucket, string objectPath, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > MaxBytes)
        {
            throw new InvalidOperationException("Invalid file size.");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Invalid file type.");
        }

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();

        await _supabase.Storage
            .From(bucket)
            .Upload(bytes, objectPath, new Supabase.Storage.FileOptions { ContentType = file.ContentType, Upsert = true });

        return _supabase.Storage.From(bucket).GetPublicUrl(objectPath);
    }
}
