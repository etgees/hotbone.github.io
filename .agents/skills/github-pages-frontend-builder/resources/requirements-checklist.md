# Requirements Gathering Checklist (fill in during Phase 1, one item at a time)

- [ ] Purpose & audience:
- [ ] Pages / sections list:
- [ ] Design preference (style, colors, references, brand assets, dark mode):
- [ ] Content & data source (real copy provided? placeholders? external API?):
- [ ] Tech stack decision (plain HTML/CSS/JS vs bundler+framework) and why:
- [ ] Repository name:
- [ ] Page type (project page `/repo/` vs user/org root page) and base path:
- [ ] Custom domain (if any):
- [ ] Membership/auth system needed (Supabase)? yes/no
      - If yes: auth methods (email/password, magic link, OAuth providers):
      - If yes: what user data/pages need to be protected:
- [ ] Dropshipping service integration needed? yes/no
      - If yes: which provider/platform (default assumption: **Printful**
        unless the user specifies another)?
      - If yes: read-only catalog only, or write/transactional (orders,
        inventory)?
      - Catalog browsing: mirrored into a Supabase table with an RLS
        "read for all" policy (direct frontend read), or fetched live from
        the provider's API?
      - Order placement (requires `PRINTFUL_API_KEY` or equivalent): 100%
        via Supabase Edge Function — confirm trigger is tied to confirmed
        payment, not a frontend event
- [ ] Payment gateway needed (ECPay 綠界 / NewebPay 藍新)? yes/no
      - If yes: which gateway (default assumption: **NewebPay** unless the
        user specifies ECPay or both)?
      - If yes: merchant credentials available (MerchantID, HashKey, HashIV)?
      - If yes: sandbox/testing only, or production?
      - Confirm: signing (`TradeInfo`/`TradeSha`) happens in one Edge
        Function, and the `NotifyURL` webhook is a **separate, dedicated**
        Edge Function
      - Confirm: frontend will poll Supabase order status rather than trust
        the `ReturnURL` redirect
- [ ] If any secret-requiring third-party integration is included: confirm
      Supabase Edge Function Secrets naming (e.g. `NEWEBPAY_HASH_KEY`,
      `NEWEBPAY_HASH_IV`, `PRINTFUL_API_KEY`) and CORS handling plan
- [ ] User confirmation of summarized requirements: yes / no
