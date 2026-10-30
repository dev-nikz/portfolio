# Contact form setup

The Outredge-inspired form and Vercel Node function are live in production. Resend delivery was verified on 30 October 2026: a labelled integration-test enquiry to nikzdev@gmail.com was marked Delivered in the Resend dashboard. No visitor-tracking service is installed.

Configure these Vercel environment variables, then redeploy:

- RESEND_API_KEY: a Resend sending API key, configured only in Vercel, never in frontend code or Git.
- CONTACT_FROM_EMAIL: a sender on your verified Resend domain, such as Portfolio <hello@yourdomain.com>.
- CONTACT_TO_EMAIL: optional; defaults to nikzdev@gmail.com.

The server validates required fields, rejects cross-origin browser submissions, uses a honeypot, keeps the recipient server-controlled, and sends plain text with the visitor email as reply-to. Configure Vercel Firewall rate limiting before enabling public delivery. Provider errors retain the typed message and never display a success state. A real, authorised production test message was sent and verified after deployment.

Suggested visitor tagging:

1. Anonymous analytics for page views, traffic sources, device breakdown, and project engagement. Vercel Web Analytics can provide aggregate traffic without identifying named visitors.
2. UTM campaign links for invitations and applications, such as ?utm_source=linkedin&utm_campaign=frontend_roles. These attribute a campaign or shared link, not a person's identity, since links can be forwarded.
3. Voluntary identification through this form. Enquiry type (role/project), company, service, and timeline can become lead tags in email or a future CRM.

Keep names and email addresses out of analytics event properties and URLs. A visit alone does not establish the visitor's identity. This implementation does not add fingerprinting or claim to identify anonymous visitors.

## Activation steps

1. In Resend, verify a domain you own and create a sending API key.
2. In the portfolio Vercel project's Settings > Environment Variables, set RESEND_API_KEY and CONTACT_FROM_EMAIL for Production and Preview. Set the sender to an address on the verified domain.
3. Redeploy the contact-form branch preview, then submit a test enquiry and confirm receipt at nikzdev@gmail.com.
4. Merge the contact-form branch to main after delivery is confirmed.

The local Vercel CLI currently reports an invalid authentication token, so environment variables could not be inspected or configured from this session. No secret was printed or committed.

## Current production configuration

RESEND_API_KEY is stored as a secret in the portfolio Vercel project. CONTACT_FROM_EMAIL uses Portfolio <onboarding@resend.dev>, and CONTACT_TO_EMAIL is nikzdev@gmail.com. The onboarding sender restricts recipients to the Resend account owner, which matches this contact-form inbox. Visitors are placed in Reply-To and are never used as the authenticated sender. Verify a custom domain before changing to a branded sender or sending to other recipients. Production variables are configured; Preview environments need their own variables before email testing there.

Configuration was completed through the authorised Vercel browser session. Actual credential values are never stored in this repository.
