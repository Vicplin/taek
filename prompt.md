Perfect, I have everything I need. Let me build all three missing endpoints now.Here are the three missing endpoints, written to exactly match your existing patterns:

---

## 1. `PUT /api/tournaments/{id}/categories`

This **replaces** all categories for a tournament. The strategy:
- Delete all existing `tournament_categories` rows (cascade deletes the type-specific rows if FK cascade is set, otherwise we handle it)
- Re-insert everything fresh using the same logic as `AddCategories`

```csharp
/// <summary>
/// PUT /api/tournaments/{id}/categories — replace all categories (upcoming only)
/// Deletes existing tournament_categories and re-inserts from scratch.
/// </summary>
[HttpPut("{id}/categories")]
[AuthorizeRole("organiser")]
public async Task<IActionResult> UpdateCategories(string id, [FromBody] List<TournamentCategoryInput> categories)
{
    var userId = GetUserId();
    if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

    var organiserId = await GetOrganiserIdAsync(userId);
    if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

    var client = CreateServiceClient();
    var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
    if (existing == null) return NotFound(new { error = "Tournament not found." });

    if (GetStatus(existing.Value) != "upcoming")
        return BadRequest(new { error = "Categories can only be edited when tournament status is 'upcoming'." });

    // --- Step 1: fetch existing tournament_categories to get their IDs ---
    var fetchResponse = await client.GetAsync(
        $"{SupabaseUrl}/rest/v1/tournament_categories?tournament_id=eq.{id}&select=id,type");
    var fetchBody = await fetchResponse.Content.ReadAsStringAsync();
    var existingCats = JsonSerializer.Deserialize<List<JsonElement>>(fetchBody) ?? new();

    // --- Step 2: delete type-specific rows first (in case no DB cascade) ---
    var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };

    foreach (var ec in existingCats)
    {
        var tcId = ec.GetProperty("id").GetString();
        var tcType = ec.GetProperty("type").GetString();
        if (tcId == null || tcType == null || !validTypes.Contains(tcType)) continue;

        var typeTable = $"{tcType}_categories";
        var fkCol = $"{tcType}_category_id";

        // Fetch competition category IDs for this tournament_category
        var ccFetchResp = await CreateServiceClient().GetAsync(
            $"{SupabaseUrl}/rest/v1/{typeTable}?tournament_category_id=eq.{tcId}&select=id");
        var ccFetchBody = await ccFetchResp.Content.ReadAsStringAsync();
        var ccRows = JsonSerializer.Deserialize<List<JsonElement>>(ccFetchBody) ?? new();

        // Delete junction rows first
        foreach (var ccRow in ccRows)
        {
            var ccId = ccRow.GetProperty("id").GetString();
            if (ccId == null) continue;

            await CreateServiceClient().DeleteAsync(
                $"{SupabaseUrl}/rest/v1/{tcType}_category_age_groups?{fkCol}=eq.{ccId}");
            await CreateServiceClient().DeleteAsync(
                $"{SupabaseUrl}/rest/v1/{tcType}_category_genders?{fkCol}=eq.{ccId}");
        }

        // Delete competition category rows
        await CreateServiceClient().DeleteAsync(
            $"{SupabaseUrl}/rest/v1/{typeTable}?tournament_category_id=eq.{tcId}");
    }

    // --- Step 3: delete tournament_categories rows ---
    await client.DeleteAsync(
        $"{SupabaseUrl}/rest/v1/tournament_categories?tournament_id=eq.{id}");

    // --- Step 4: re-insert (same logic as AddCategories) ---
    var categoryResults = new List<object>();

    foreach (var cat in categories)
    {
        if (!validTypes.Contains(cat.Type)) continue;

        var catPayload = new { tournament_id = id, type = cat.Type };
        var catClient = CreateServiceClient();
        catClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var catContent = new StringContent(JsonSerializer.Serialize(catPayload), Encoding.UTF8, "application/json");
        var catResponse = await catClient.PostAsync($"{SupabaseUrl}/rest/v1/tournament_categories", catContent);
        var catBody = await catResponse.Content.ReadAsStringAsync();
        if (!catResponse.IsSuccessStatusCode) continue;

        var catRows = JsonSerializer.Deserialize<List<JsonElement>>(catBody);
        var tournamentCategoryId = catRows?[0].GetProperty("id").GetString();
        if (tournamentCategoryId == null) continue;

        var table = $"{cat.Type}_categories";
        var prefix = $"{cat.Type}_category";
        var fkColumn = $"{prefix}_id";
        var ageGroupJunctionTable = $"{prefix}_age_groups";
        var genderJunctionTable = $"{prefix}_genders";

        var competitionResults = new List<object>();
        foreach (var cc in cat.CompetitionCategories ?? new List<CompetitionCategoryInput>())
        {
            static string? NullIfEmpty(string? v) => string.IsNullOrWhiteSpace(v) ? null : v;
            var ccPayload = new Dictionary<string, object?>
            {
                ["tournament_category_id"] = tournamentCategoryId,
                ["name"] = cc.Name,
                ["belt_rank_from_id"] = NullIfEmpty(cc.BeltRankFromId),
                ["belt_rank_to_id"] = NullIfEmpty(cc.BeltRankToId),
                ["division_id"] = NullIfEmpty(cc.DivisionId),
                ["is_team"] = cc.IsTeam,
                ["team_size"] = cc.TeamSize,
                ["fee_amount"] = cc.FeeAmount
            };

            var ccClient = CreateServiceClient();
            ccClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
            var ccContent = new StringContent(JsonSerializer.Serialize(ccPayload), Encoding.UTF8, "application/json");
            var ccResponse = await ccClient.PostAsync($"{SupabaseUrl}/rest/v1/{table}", ccContent);
            var ccBody = await ccResponse.Content.ReadAsStringAsync();
            if (!ccResponse.IsSuccessStatusCode) { competitionResults.Add(new { error = ccBody }); continue; }

            var ccRows2 = JsonSerializer.Deserialize<List<JsonElement>>(ccBody);
            var ccId2 = ccRows2?[0].GetProperty("id").GetString();
            if (ccId2 == null) continue;

            foreach (var agId in cc.AgeGroupIds ?? new List<string>())
            {
                var jp = new Dictionary<string, object?> { [fkColumn] = ccId2, ["age_group_id"] = agId };
                var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{ageGroupJunctionTable}", jc);
            }

            foreach (var gId in cc.GenderIds ?? new List<string>())
            {
                var jp = new Dictionary<string, object?> { [fkColumn] = ccId2, ["gender_id"] = gId };
                var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{genderJunctionTable}", jc);
            }

            competitionResults.Add(new { category = ccRows2?[0], age_group_ids = cc.AgeGroupIds, gender_ids = cc.GenderIds });
        }

        categoryResults.Add(new { type = cat.Type, tournament_category_id = tournamentCategoryId, competition_categories = competitionResults });
    }

    return Ok(new { tournament_id = id, categories = categoryResults });
}
```

---

## 2. `PUT /api/tournaments/{id}/documents`

Replaces the **bundle** and **schedule** fields on the tournament, and can add a new `other` document. Matches the file handling pattern from `UpdateTournament`.

```csharp
/// <summary>
/// PUT /api/tournaments/{id}/documents — replace tournament documents (upcoming only)
/// multipart/form-data: bundle (PDF), schedule (image), other (PDF, appended)
/// </summary>
[HttpPut("{id}/documents")]
[AuthorizeRole("organiser")]
public async Task<IActionResult> UpdateDocuments(
    string id,
    IFormFile? bundle,
    IFormFile? schedule,
    IFormFile? other,
    CancellationToken cancellationToken)
{
    var userId = GetUserId();
    if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

    var organiserId = await GetOrganiserIdAsync(userId);
    if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

    var client = CreateServiceClient();
    var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
    if (existing == null) return NotFound(new { error = "Tournament not found." });

    if (GetStatus(existing.Value) != "upcoming")
        return BadRequest(new { error = "Documents can only be edited when tournament status is 'upcoming'." });

    if (bundle == null && schedule == null && other == null)
        return BadRequest(new { error = "At least one file must be provided." });

    // Validate
    if (bundle != null && !IsValidPdf(bundle))
        return BadRequest(new { error = "Bundle must be a PDF file." });
    if (schedule != null && !IsValidImage(schedule))
        return BadRequest(new { error = "Schedule must be an image (jpg, png, webp)." });
    if (other != null && !IsValidPdf(other))
        return BadRequest(new { error = "Other document must be a PDF file." });

    // Upload bundle / schedule and patch the tournament row
    var patchPayload = new Dictionary<string, object?>();

    if (bundle != null)
    {
        try
        {
            var url = await UploadFileAsync(organiserId, "bundle", ".pdf", bundle, cancellationToken);
            patchPayload["tournament_bundle_url"] = url;
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = $"Bundle upload failed: {ex.Message}" });
        }
    }

    if (schedule != null)
    {
        try
        {
            var url = await UploadFileAsync(organiserId, "schedule", null, schedule, cancellationToken);
            patchPayload["schedule_url"] = url;
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = $"Schedule upload failed: {ex.Message}" });
        }
    }

    if (patchPayload.Count > 0)
    {
        patchPayload["updated_at"] = DateTime.UtcNow;
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var patchContent = new StringContent(JsonSerializer.Serialize(patchPayload), Encoding.UTF8, "application/json");
        var patchResponse = await client.PatchAsync($"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}", patchContent);

        if (!patchResponse.IsSuccessStatusCode)
        {
            var patchBody = await patchResponse.Content.ReadAsStringAsync();
            return StatusCode((int)patchResponse.StatusCode, new { error = patchBody });
        }
    }

    // Append new "other" doc row (same as UpdateTournament)
    if (other != null)
    {
        try
        {
            var otherUrl = await UploadFileAsync(organiserId, "other", ".pdf", other, cancellationToken);
            var docPayload = new { tournament_id = id, url = otherUrl, file_name = other.FileName };
            var docContent = new StringContent(JsonSerializer.Serialize(docPayload), Encoding.UTF8, "application/json");
            await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/tournament_documents", docContent);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = $"Other document upload failed: {ex.Message}" });
        }
    }

    return NoContent();
}
```

---

## 3. `DELETE /api/tournaments/{id}/documents/{docId}` — verify existing

Your existing `DeleteDocument` looks correct. Two things worth confirming work as expected:

**✅ Looks good:**
- Ownership check via `GetTournamentForOrganiserAsync` ✓
- Status guard (`upcoming` only) ✓
- Filters by both `id` and `tournament_id` to prevent cross-tournament deletion ✓

**⚠️ One gap to consider:** Supabase's REST DELETE returns `200` or `204` even if 0 rows were matched. If you want a proper `404` when the `docId` doesn't exist, add a fetch-before-delete:

```csharp
// Add this check BEFORE the DeleteAsync call in your existing DeleteDocument:
var checkResp = await client.GetAsync(
    $"{SupabaseUrl}/rest/v1/tournament_documents?id=eq.{docId}&tournament_id=eq.{id}&select=id&limit=1");
var checkBody = await checkResp.Content.ReadAsStringAsync();
var checkRows = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);
if (checkRows == null || checkRows.Count == 0)
    return NotFound(new { error = "Document not found." });

// then your existing DeleteAsync...
```

---

## Summary of what's new

| Endpoint | Status | Notes |
|---|---|---|
| `PUT /api/tournaments/{id}/categories` | ✅ Built | Delete-then-reinsert strategy, mirrors `AddCategories` exactly |
| `PUT /api/tournaments/{id}/documents` | ✅ Built | Patches `bundle_url`/`schedule_url` on tournament row, appends `other` doc |
| `DELETE /api/tournaments/{id}/documents/{docId}` | ✅ Patch only | Add fetch-before-delete for proper 404 |

Ready to move on to **Registrations** (`GET` + `PATCH approve/reject`) whenever you are.