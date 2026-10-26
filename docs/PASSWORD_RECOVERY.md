# Email code password recovery

The application requests recovery with `resetPasswordForEmail`, verifies the email and six-digit code using `verifyOtp({ email, token, type: "recovery" })`, then updates the authenticated user's password using `updateUser`. It never generates, stores, or validates an OTP locally and does not use passwordless sign-in or create accounts. Supabase enforces token expiry, single use, rate limits, and password rules. The browser adds a 60-second resend cooldown and preserves leading zeroes in the code input.

## Local email-template handoff

The received default **Reset Password** email contains a link because the hosted template has not been replaced with the code template. `supabase/templates/recovery.html` is only a local source file: neither `npm run dev`, an application deployment, nor editing that file changes the email Supabase sends.

Open `/email-template` on the local development server to preview the PHINMA green-and-gold email, copy its exact HTML, or download `recovery.html`. The preview displays six dots instead of a usable code. The source retains `{{ .Token }}` so Supabase can insert the recipient's actual OTP. The email uses presentation tables and inline styles, avoids external images/fonts, and states single use and expiry without inventing a fixed duration. Browser preview is not a test of actual email-client rendering.

The page exposes only this static template and public project setup links; it does not read credentials, send an email, or change hosted settings. Template preparation saved no hosted template and sent no reset email. The owner subsequently authorized application deployment; that does not apply the Auth template or OTP setting.

## Required hosted configuration

The connected Supabase tools do not expose Auth email-template or OTP-length updates. These settings must be applied by the project owner; application deployment does not change them.

1. Check [Auth SMTP settings](https://supabase.com/dashboard/project/ulymtioaxraqvoqongrj/auth/smtp). This project was created on 21 October 2026, after the customization change: if it uses the Free plan with the default email provider, configure custom SMTP before editing templates. Plan and current SMTP eligibility were not changed or verified by this handoff. Supabase's built-in email service can also restrict recipient addresses; configure real delivery for university accounts through the owner's SMTP provider.
2. Open [the project's Auth email templates](https://supabase.com/dashboard/project/ulymtioaxraqvoqongrj/auth/templates), choose **Reset Password**, and replace its body with [`supabase/templates/recovery.html`](../supabase/templates/recovery.html), available through **Copy HTML** or **Download HTML** on `/email-template`. Set subject to **Your PHINMA UI Event password reset code** and save. Preserve `{{ .Token }}` exactly; never replace it with a sample number. The default link-only email remains in use until this hosted change is saved.
3. In [Authentication → Sign In / Providers → Email](https://supabase.com/dashboard/project/ulymtioaxraqvoqongrj/auth/providers), confirm **Email OTP Length** is **6**. Configure the expiration to suit university policy. The UI does not promise a fixed expiry time.
4. Test with an owner-controlled account: request a code, receive the email, reject a wrong code, verify the correct code, set a new password, then sign in with that password. Check that used/expired codes fail. Do not put codes or passwords in issues, logs, or committed files.

The code flow does not require following an email redirect or opening the email on the same device. `/reset-password` requires a verified Auth user. Existing recovery links are still handled by the Supabase browser client's PKCE exchange and the shared `PASSWORD_RECOVERY` listener, but new recovery emails should use the code template above.

New Free projects created from June 3, 2026 cannot customize templates while using Supabase's default email provider. If this restriction applies, configure a custom SMTP provider before applying the template; existing and paid projects have different eligibility. See the [Supabase template customization change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

Reference: [Supabase reset password API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [verify OTP API](https://supabase.com/docs/reference/javascript/auth-verifyotp), and [email template variables](https://supabase.com/docs/guides/auth/auth-email-templates).

## Diagnosed request failure

On 2026-10-26, hosted Auth logs for `/recover` confirmed HTTP 429 with `over_email_send_rate_limit`. The UI now identifies email sending limits, other request throttles, and `email_address_not_authorized` separately; rate-limited failures also start a 60-second browser retry cooldown. That timer only prevents rapid retries and does not reset or predict the hosted email quota. Unknown errors stay generic without disclosing account existence.

Do not repeatedly request codes when the provider quota is exhausted. Wait for its sending allowance to recover, or have the project owner configure/check custom SMTP in [Auth SMTP settings](https://supabase.com/dashboard/project/ulymtioaxraqvoqongrj/auth/smtp). The existing six-digit template and OTP-length setup is still required. Diagnosis used read-only logs; no reset email was sent and no hosted settings were changed.
