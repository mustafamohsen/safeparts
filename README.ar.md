<p align="center">
  <img src="web/src/assets/logo.svg" width="120" alt="شعار Safeparts" />
</p>

<div dir="rtl">

# Safeparts

[العربية](README.ar.md) | [English](README.md)

Safeparts هي مجموعة أدوات لمشاركة الأسرار بالعتبة.
تقوم بتقسيم سر واحد إلى *n* حصص استعادة، ثم تستعيده لاحقا باستخدام أي *k* حصص منها.

- تطبيق الويب: https://safeparts.netlify.app
- التوثيق: https://safeparts.netlify.app/help/ (بالإنجليزية) و https://safeparts.netlify.app/help/ar/ (بالعربية)
- الإصدارات: https://github.com/mustafamohsen/safeparts/releases

## لماذا تستخدمه

Safeparts مفيدة عندما تريد أن تتطلب عملية الاستعادة تعاونا، بدل الاعتماد على نسخة احتياطية واحدة "مثالية".

أمثلة شائعة:

- مفاتيح الاستعادة / المفاتيح الرئيسية لمدير كلمات المرور
- رموز النسخ الاحتياطي للمصادقة الثنائية (2FA)
- رموز API، مفاتيح التوقيع، بيانات اعتماد "حالات الطوارئ" (break-glass)
- التخطيط العائلي / لوصي أو منفذ وصية (بحيث لا يحمل شخص واحد الوصول بالكامل)
- أسرار الفرق عندما تريد فصل الصلاحيات

## الفكرة الأساسية

تختار عتبة (*k* من *n*):

- أقل من *k* حصص: الاستعادة مستحيلة (ولا تكشف الحصص عن السر).
- أي *k* حصص: الاستعادة تنجح.

القيود: `1 <= k <= n <= 255`. إذا فقدت حصصا حتى يصبح المتبقي أقل من *k*، تصبح الاستعادة مستحيلة.

إذا أردت افتراضات معقولة:

- للاستعادة الشخصية: `k=2, n=3`
- للفرق: `k=3, n=5`

اختر خطة يمكن تنفيذها تحت الضغط. إذا كانت معقدة أكثر من اللازم، فلن تُستخدم.

## ما الذي يفعله (وما الذي لا يفعله)

**يتضمن**

- مشاركة سر على طريقة Shamir فوق `GF(256)` (على مستوى البايت)
- تحقق سلامة عند الدمج (وسم BLAKE3)
- حماية اختيارية بعبارة مرور (تشفير ثم تقسيم): Argon2id -> ChaCha20-Poly1305
- عدة ترميزات لنفس بايتات حزمة الحصة:
  - `base64` (`base64url`، بدون padding)
  - `base58` (`base58check`)
  - `mnemo-words` (ترميز بالكلمات + CRC16)
  - `mnemo-bip39` (عبارات صالحة وفق BIP-39؛ قد تكون الحصة عدة عبارات مفصولة بـ `/`)

واجهة الويب حاليا توفر `base64url` و `mnemo-words`. أما CLI و TUI فتدعمان كل الترميزات.

داخليا، يقوم Safeparts (اختياريا) بالتشفير، ثم يضيف وسم BLAKE3، ثم يطبق مشاركة Shamir بايت-ببايت. عند الدمج، يعيد البناء، يتحقق من الوسم، ثم وفقط بعدها يفك التشفير.

**لا يتضمن**

- التخزين. Safeparts لا يدير أين تعيش الحصص.
- الحماية ضد شخص يملك بشكل مشروع *k* حصص.
- وظائف محافظ/بذور. الحصص المرمزة بعبارات mnemonic هي ترميز للحصص، وليست بذور محافظ.

## قواعد السلامة (يرجى القراءة)

إذا أخذت شيئا واحدا من هذا القسم: **الحصص حساسة بقدر حساسية السر نفسه**.

- لا تلصق أسرارا/حصصا حقيقية في الدردشة، أو التذاكر، أو القضايا (issues)، أو السجلات (logs)، أو لقطات الشاشة.
- لا تضع حصتين في نفس المكان (حصتان في نفس الخزنة تعني أن اختراقا واحدا قد يكشف السر).
- اكتب "دليل التنفيذ" (runbook): من يحمل أي حصة، وكيف تصل إليهم.
- نفّذ تمرينا بسِرٍّ اصطناعي قبل الاعتماد على خطة استعادة حقيقية.
- بعد أي استعادة "طوارئ" (break-glass)، افترض أن الحصص التي جُمعت قد انكشفت. غيّر السر الأصلي ثم أعد التقسيم.

## الواجهات

يأتي Safeparts بعدة واجهات فوق نفس النواة:

- **واجهة ويب** (WASM، تعمل بالكامل داخل المتصفح؛ بدون خادم): الأسهل لسير عمل مرة واحدة.
- **CLI** (`safeparts`): مناسب للسكربتات؛ جيد لدليل التنفيذ والأتمتة.
- **TUI** (`safeparts-tui` أو `safeparts tui`): سير عمل تفاعلي في الطرفية؛ مناسب لأجهزة دون اتصال.
- **مكتبة Rust** (`safeparts_core`): الخوارزميات الأساسية وصيغ الحزم.

## مكتبة Rust

إذا أردت دمج Safeparts داخل مشروع Rust، ابدأ بـ `safeparts_core`:

```rust
use safeparts_core::{combine_shares, split_secret, CoreResult};

fn main() -> CoreResult<()> {
    let packets = split_secret(b"secret", 2, 3, None)?;
    let recovered = combine_shares(&packets[..2], None)?;
    assert_eq!(recovered, b"secret");
    Ok(())
}
```

للترميزات النصية، راجع `safeparts_core::ascii` و `safeparts_core::mnemo_words` و `safeparts_core::mnemo_bip39`.

## التثبيت

حمّل أرشيف الإصدار من GitHub Releases. كل إصدار يتضمن:

- `safeparts` (CLI)
- `safeparts-tui` (واجهة طرفية تفاعلية)

الخطوات حسب المنصة (وملاحظات البناء من المصدر) موجودة في التوثيق:

- https://safeparts.netlify.app/help/build-and-run/

## بدء سريع للـ CLI

قسّم سِرّا إلى 3 حصص، بحيث تتطلب الاستعادة أي حصتين:

```bash
echo -n "my secret" | safeparts split -k 2 -n 3 -e base64
```

ادمج (الصق أي *k* حصص على stdin):

```bash
printf "%s\n%s\n" "<share1>" "<share2>" | safeparts combine
```

اكتب الحصص والسر المستعاد في ملفات:

```bash
echo -n "my secret" | safeparts split -k 2 -n 3 -e base64 -o shares.txt
printf "%s\n%s\n" "<share1>" "<share2>" | safeparts combine -o secret.bin
```

عبارات المرور (اختيارية):

- فضّل `--passphrase-file` (`-P`) على `--passphrase` (`-p`) في البيئات التي تحتفظ بسجل الأوامر.

```bash
echo -n "my secret" | safeparts split -k 2 -n 3 -e base64 -P passphrase.txt
printf "%s\n%s\n" "<share1>" "<share2>" | safeparts combine -P passphrase.txt
```

الترميزات:

- `split` يدعم: `base64`, `base58`, `mnemo-words`, `mnemo-bip39`
- `combine` يمكنه اكتشاف الترميز تلقائيا إذا لم تمرر `--encoding`

## TUI

شغّل واجهة الطرفية التفاعلية:

```bash
safeparts-tui
```

أو شغّلها عبر CLI:

```bash
safeparts tui
```

للاختصارات وسير عمل دون اتصال، راجع: https://safeparts.netlify.app/help/tui/

## واجهة الويب (محليا)

واجهة الويب تقوم بالتقسيم/الدمج محليا داخل المتصفح عبر WASM.
لا ترفع أي شيء إلا إذا اخترت النسخ/اللصق في مكان آخر أو نشرت نسخة معدلة.

```bash
cd web
bun install
bun run build:wasm
bun run dev
```

افتح http://localhost:5173.

موقع التوثيق (يُخدم تحت `/help/`):

```bash
cd web/help
bun install
bun run dev
```

افتح http://localhost:4321/help/.

## التطوير

Rust (مطابق لـ CI):

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

اختبارات إتاحة الويب (Playwright + axe):

```bash
cd web
bun install
bun run test:a11y:install
bun run test:a11y
```

## هيكل المستودع

- `crates/safeparts_core/`: خوارزميات النواة، صيغة الحزم، الترميزات، التشفير
- `crates/safeparts/`: غلاف CLI (الملف التنفيذي: `safeparts`)
- `crates/safeparts_tui/`: واجهة طرفية تفاعلية (الملف التنفيذي: `safeparts-tui`)
- `crates/safeparts_wasm/`: صادرات wasm-bindgen المستخدمة في واجهة الويب
- `web/`: تطبيق Vite + React
- `web/help/`: توثيق Astro + Starlight

## المساهمة

المساهمات مرحب بها.
ابدأ بقضية (issue) لكي نتفق على النطاق والاتجاه ومعايير القبول قبل كتابة الكود.

سير العمل:

1. افتح أو اختر قضية.
2. انسخ المستودع (fork).
3. أنشئ فرعا مخصصا (مثلا `feat/<short-slug>` أو `fix/<short-slug>`).
4. نفّذ التغييرات وشغّل الفحوصات:
   - `cargo fmt --all`
   - `cargo clippy --all-targets --all-features -- -D warnings`
   - `cargo test --all-features`
   - `cd web && bun run test:a11y` (إذا لمست الويب/التوثيق)
5. افتح PR واربط القضية (مثلا "Fixes #123").

## الترخيص

MIT. راجع LICENSE.

</div>
