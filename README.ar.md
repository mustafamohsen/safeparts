<p align="center">
  <img src="web/src/assets/logo.svg" width="120" alt="شعار Safeparts" />
</p>

<div dir="rtl" lang="ar" align="right">

# Safeparts

<a href="README.ar.md">العربية</a> | <a dir="ltr" href="README.md">English</a>

Safeparts هي مجموعة أدوات لمشاركة الأسرار بالعتبة.
تقوم بتقسيم سر واحد إلى *n* حصص استعادة، ثم تستعيده لاحقا باستخدام أي *k* حصص منها.

- تطبيق الويب: <a dir="ltr" href="https://safeparts.netlify.app">https://safeparts.netlify.app</a>
- التوثيق: <a dir="ltr" href="https://safeparts.netlify.app/help/">https://safeparts.netlify.app/help/</a> (بالإنجليزية) و <a dir="ltr" href="https://safeparts.netlify.app/help/ar/">https://safeparts.netlify.app/help/ar/</a> (بالعربية)
- الإصدارات: <a dir="ltr" href="https://github.com/mustafamohsen/safeparts/releases">https://github.com/mustafamohsen/safeparts/releases</a>

## لماذا تستخدمه

Safeparts مفيدة عندما تريد أن تتطلب عملية الاستعادة تعاونا، بدل الاعتماد على نسخة احتياطية واحدة "مثالية".

أمثلة شائعة:

- مفاتيح الاستعادة / المفاتيح الرئيسية لمدير كلمات المرور
- رموز النسخ الاحتياطي للمصادقة الثنائية <span dir="ltr">(2FA)</span>
- رموز <span dir="ltr">API</span>، مفاتيح التوقيع، بيانات اعتماد "حالات الطوارئ" <span dir="ltr">(break-glass)</span>
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
- تحقق سلامة عند الدمج (وسم <span dir="ltr">BLAKE3</span>)
- حماية اختيارية بعبارة مرور (تشفير ثم تقسيم): <span dir="ltr">Argon2id -> ChaCha20-Poly1305</span>
- عدة ترميزات لنفس بايتات حزمة الحصة:
  - `base64` (`base64url`، بدون <span dir="ltr">padding</span>)
  - `base58` (`base58check`)
  - `mnemo-words` (ترميز بالكلمات + <span dir="ltr">CRC16</span>)
  - `mnemo-bip39` (عبارات صالحة وفق <span dir="ltr">BIP-39</span>؛ قد تكون الحصة عدة عبارات مفصولة بـ <span dir="ltr">/</span>)

واجهة الويب حاليا توفر `base64url` و `mnemo-words`. أما <span dir="ltr">CLI</span> و <span dir="ltr">TUI</span> فتدعمان كل الترميزات.

داخليا، يقوم Safeparts (اختياريا) بالتشفير، ثم يضيف وسم <span dir="ltr">BLAKE3</span>، ثم يطبق مشاركة Shamir بايت-ببايت. عند الدمج، يعيد البناء، يتحقق من الوسم، ثم وفقط بعدها يفك التشفير.

**لا يتضمن**

- التخزين. Safeparts لا يدير أين تعيش الحصص.
- الحماية ضد شخص يملك بشكل مشروع *k* حصص.
- وظائف محافظ/بذور. الحصص المرمزة بعبارات <span dir="ltr">mnemonic</span> هي ترميز للحصص، وليست بذور محافظ.

## قواعد السلامة (يرجى القراءة)

إذا أخذت شيئا واحدا من هذا القسم: **الحصص حساسة بقدر حساسية السر نفسه**.

- لا تلصق أسرارا/حصصا حقيقية في الدردشة، أو التذاكر، أو القضايا <span dir="ltr">(issues)</span>، أو السجلات <span dir="ltr">(logs)</span>، أو لقطات الشاشة.
- لا تضع حصتين في نفس المكان (حصتان في نفس الخزنة تعني أن اختراقا واحدا قد يكشف السر).
- اكتب "دليل التنفيذ" <span dir="ltr">(runbook)</span>: من يحمل أي حصة، وكيف تصل إليهم.
- نفّذ تمرينا بسِرٍّ اصطناعي قبل الاعتماد على خطة استعادة حقيقية.
- بعد أي استعادة "طوارئ" <span dir="ltr">(break-glass)</span>، افترض أن الحصص التي جُمعت قد انكشفت. غيّر السر الأصلي ثم أعد التقسيم.

## الواجهات

يأتي Safeparts بعدة واجهات فوق نفس النواة:

- **واجهة ويب** (<span dir="ltr">WASM</span>، تعمل بالكامل داخل المتصفح؛ بدون خادم): الأسهل لسير عمل مرة واحدة.
- **<span dir="ltr">CLI</span>** (<span dir="ltr"><code>safeparts</code></span>): مناسب للسكربتات؛ جيد لدليل التنفيذ والأتمتة.
- **<span dir="ltr">TUI</span>** (<span dir="ltr"><code>safeparts-tui</code></span> أو <span dir="ltr"><code>safeparts tui</code></span>): سير عمل تفاعلي في الطرفية؛ مناسب لأجهزة دون اتصال.
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

حمّل أرشيف الإصدار من <span dir="ltr">GitHub Releases</span>. كل إصدار يتضمن:

- `safeparts` (<span dir="ltr">CLI</span>)
- `safeparts-tui` (واجهة طرفية تفاعلية)

الخطوات حسب المنصة (وملاحظات البناء من المصدر) موجودة في التوثيق:

- <a dir="ltr" href="https://safeparts.netlify.app/help/build-and-run/">https://safeparts.netlify.app/help/build-and-run/</a>

## بدء سريع لـ <span dir="ltr">CLI</span>

قسّم سِرّا إلى 3 حصص، بحيث تتطلب الاستعادة أي حصتين:

```bash
echo -n "my secret" | safeparts split -k 2 -n 3 -e base64
```

ادمج (الصق أي *k* حصص على <span dir="ltr">stdin</span>):

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

## <span dir="ltr">TUI</span>

شغّل واجهة الطرفية التفاعلية:

```bash
safeparts-tui
```

أو شغّلها عبر <span dir="ltr">CLI</span>:

```bash
safeparts tui
```

للاختصارات وسير عمل دون اتصال، راجع: <a dir="ltr" href="https://safeparts.netlify.app/help/tui/">https://safeparts.netlify.app/help/tui/</a>

## واجهة الويب (محليا)

واجهة الويب تقوم بالتقسيم/الدمج محليا داخل المتصفح عبر <span dir="ltr">WASM</span>.
لا ترفع أي شيء إلا إذا اخترت النسخ/اللصق في مكان آخر أو نشرت نسخة معدلة.

```bash
cd web
bun install
bun run build:wasm
bun run dev
```

افتح <a dir="ltr" href="http://localhost:5173">http://localhost:5173</a>.

موقع التوثيق (يُخدم تحت <span dir="ltr"><code>/help/</code></span>):

```bash
cd web/help
bun install
bun run dev
```

افتح <a dir="ltr" href="http://localhost:4321/help/">http://localhost:4321/help/</a>.

## التطوير

<span dir="ltr">Rust</span> (مطابق لـ <span dir="ltr">CI</span>):

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

اختبارات إتاحة الويب (<span dir="ltr">Playwright</span> + <span dir="ltr">axe</span>):

```bash
cd web
bun install
bun run test:a11y:install
bun run test:a11y
```

## هيكل المستودع

- `crates/safeparts_core/`: خوارزميات النواة، صيغة الحزم، الترميزات، التشفير
- `crates/safeparts/`: غلاف <span dir="ltr">CLI</span> (الملف التنفيذي: `safeparts`)
- `crates/safeparts_tui/`: واجهة طرفية تفاعلية (الملف التنفيذي: `safeparts-tui`)
- `crates/safeparts_wasm/`: صادرات <span dir="ltr">wasm-bindgen</span> المستخدمة في واجهة الويب
- `web/`: تطبيق <span dir="ltr">Vite + React</span>
- `web/help/`: توثيق <span dir="ltr">Astro + Starlight</span>

## المساهمة

المساهمات مرحب بها.
ابدأ بقضية <span dir="ltr">(issue)</span> لكي نتفق على النطاق والاتجاه ومعايير القبول قبل كتابة الكود.

سير العمل:

1. افتح أو اختر قضية.
2. انسخ المستودع <span dir="ltr">(fork)</span>.
3. أنشئ فرعا مخصصا (مثلا `feat/<short-slug>` أو `fix/<short-slug>`).
4. نفّذ التغييرات وشغّل الفحوصات:
   - `cargo fmt --all`
   - `cargo clippy --all-targets --all-features -- -D warnings`
   - `cargo test --all-features`
   - `cd web && bun run test:a11y` (إذا لمست الويب/التوثيق)
5. افتح <span dir="ltr">PR</span> واربط القضية (مثلا <span dir="ltr">"Fixes #123"</span>).

## الترخيص

<span dir="ltr">MIT</span>. راجع <span dir="ltr">LICENSE</span>.

</div>
