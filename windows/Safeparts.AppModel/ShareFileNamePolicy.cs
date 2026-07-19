using System.Text;
using System.Text.RegularExpressions;

namespace Safeparts.AppModel;

public static partial class ShareFileNamePolicy
{
    private static readonly char[] Invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    [GeneratedRegex("^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\\..*)?$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ReservedName();

    public static string Individual(EncodedShare share) => $"safeparts-{share.SetId}-share-{share.Index}-of-{share.ShareCount}.txt";

    public static string Export(EncodedShare share, string prefix)
    {
        string suffix = Individual(share); string safe = Sanitize(prefix);
        if (safe.Length == 0) return suffix;
        const int maximum = 200;
        int allowed = Math.Max(0, maximum - suffix.Length - 1);
        if (safe.Length > allowed) safe = TruncateUtf16(safe, allowed).TrimEnd(' ', '.');
        return safe.Length == 0 ? suffix : $"{safe}-{suffix}";
    }

    public static string Sanitize(string value)
    {
        StringBuilder result = new(); bool separator = false;
        foreach (char character in value.Trim())
        {
            bool invalid = char.IsControl(character) || Invalid.Contains(character);
            if (invalid || char.IsWhiteSpace(character)) { separator = result.Length > 0; continue; }
            if (separator && result[^1] != '-') result.Append('-');
            separator = false; result.Append(character);
        }
        string safe = result.ToString().Trim(' ', '.', '-');
        if (ReservedName().IsMatch(safe)) safe = $"_{safe}";
        return safe;
    }

    private static string TruncateUtf16(string value, int length)
    {
        if (value.Length <= length) return value;
        string result = value[..length];
        if (result.Length > 0 && char.IsHighSurrogate(result[^1])) result = result[..^1];
        return result;
    }
}
