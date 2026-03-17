<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
</script>

<svelte:head>
  <title>Shipping &amp; Return Policy — Potency By Potamus</title>
  <meta name="description" content="Shipping and return policy for Potency By Potamus." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="page-hero">
    <div class="page-hero-inner">
      <p class="page-eyebrow">Potency By Potamus</p>
      <h1 class="page-title">Shipping &amp; Return Policy</h1>
    </div>
  </section>

  <!-- ── CONTENT ───────────────────────────────────────────── -->
  <section class="section">
    <div class="section-inner">
      <p class="section-label">Orders &amp; Returns</p>
      <h2 class="section-heading">How It Works</h2>

      <h3 class="policy-heading">Shipping</h3>
      <p class="body-text">
        All items will ship within 3–5 business days via USPS or UPS. Shipping time is 7 business
        days or less. Tracking information will be emailed to the address provided on the order.
      </p>
      <p class="body-text">
        Shipping cost is a flat rate of $6.25, or free on orders over $125.
      </p>

      <h3 class="policy-heading">Returns</h3>
      <p class="body-text">
        We accept returns. You can return unopened items in the original packaging within 30 days of
        your purchase with receipt or proof of purchase. If 30 days or more have passed since your
        purchase, we cannot offer you a refund or an exchange.
      </p>
      <p class="body-text">
        Contact <a href="mailto:potencybypotamus@gmail.com">potencybypotamus@gmail.com</a> to get a
        return authorization number. All returns will ship to:
      </p>
      <address class="address-block">
        <span>Potency By Potamus</span>
        <span>P.O. Box 418</span>
        <span>Endicott, WA 99125</span>
      </address>
      <p class="body-text">
        Upon receipt of the returned item, we will fully examine it and notify you via email, within
        a reasonable period of time, whether you are entitled to a return. If you are entitled to a
        return, we will refund your purchase price (minus a 20% restocking fee if the item was not
        defective) and a credit will automatically be applied to your original method of payment.
        Only regular priced items may be refunded. Sale items are non-refundable. To follow up on
        the status of your return, please contact us at
        <a href="mailto:potencybypotamus@gmail.com">potencybypotamus@gmail.com</a>.
      </p>
      <p class="body-text">
        Refunds do not include any shipping and handling charges shown on the packaging slip or
        invoice. Shipping charges for all returns must be prepaid and insured by you. You are
        responsible for any loss or damage to hardware during shipment. We do not guarantee that we
        will receive your returned item. Shipping and handling charges are not refundable. Any
        amounts refunded will not include the cost of shipping.
      </p>

      <h3 class="policy-heading">Exchanges</h3>
      <p class="body-text">
        We only exchange goods if they are defective or damaged. In circumstances where you consider
        that a product is defective, you should promptly contact us at
        <a href="mailto:potencybypotamus@gmail.com">potencybypotamus@gmail.com</a> with details of
        the product and the defect. You can send the item you consider defective to:
      </p>
      <address class="address-block">
        <span>Potency By Potamus</span>
        <span>P.O. Box 418</span>
        <span>Endicott, WA 99125</span>
      </address>
      <p class="body-text">
        Upon receipt of the returned product, we will fully examine it and notify you via email,
        within a reasonable period of time, whether you are entitled to a replacement as a result of
        the defect. If you are eligible, we will send you a replacement product.
      </p>
    </div>
  </section>

  <PublicFooter />

</div>

<style>
  .page-wrap {
    min-height: 100vh;
    background: var(--body-background-color);
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  :global(.dark) .page-wrap {
    background: var(--body-background-color-dark);
  }

  .page-hero {
    background: oklch(44% 0.09 220);
    padding: calc(var(--spacing) * 36) calc(var(--spacing) * 8) calc(var(--spacing) * 20);
    text-align: center;
  }

  .page-hero-inner {
    max-width: 52rem;
    margin: 0 auto;
  }

  .page-eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .page-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: #fff;
    margin: 0;
    line-height: 1.1;
  }

  .section {
    padding: calc(var(--spacing) * 24) calc(var(--spacing) * 8);
  }

  .section-inner {
    max-width: 44rem;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-primary-500);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .section-heading {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 8);
    line-height: 1.2;
  }

  :global(.dark) .section-heading {
    color: var(--color-surface-50);
  }

  .policy-heading {
    font-size: 1.125rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: calc(var(--spacing) * 10) 0 calc(var(--spacing) * 4);
    line-height: 1.3;
  }

  .policy-heading:first-of-type {
    margin-top: 0;
  }

  :global(.dark) .policy-heading {
    color: var(--color-surface-50);
  }

  .body-text {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--color-surface-500);
    margin: 0 0 calc(var(--spacing) * 5);
  }

  :global(.dark) .body-text {
    color: var(--color-surface-300);
  }

  .body-text a {
    color: var(--color-primary-500);
    text-decoration: none;
  }

  .body-text a:hover {
    text-decoration: underline;
  }

  .address-block {
    display: flex;
    flex-direction: column;
    font-style: normal;
    font-size: 1rem;
    line-height: 1.8;
    color: var(--color-surface-500);
    margin: 0 0 calc(var(--spacing) * 5);
    padding-left: calc(var(--spacing) * 5);
    border-left: 2px solid var(--color-surface-200);
  }

  :global(.dark) .address-block {
    color: var(--color-surface-300);
    border-left-color: var(--color-surface-700);
  }
</style>
