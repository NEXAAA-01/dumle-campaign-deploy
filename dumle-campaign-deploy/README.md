# Ask Dumle Maol campaign site

This folder is a separate Netlify deployment for the white-background Ask Dumle Maol site. It does not modify the existing Ask Dr. Gabriel site.

## What is included

- Responsive public site with the supplied portrait, APC/Rainbow Coalition branding, and Road, UNI 1, and Bonny photos.
- Persona prompts that prefill the chat question, an automated multilingual chat interface, and a private campaign follow-up form.
- Netlify Functions for health checks, form tokens, question/chat storage, coordinator login, and private video uploads.
- Supabase schema for private messages, chat logs, coordinator allowlisting, rate limits, and a private video bucket.
- Password-protected coordinator dashboard at `/admin/` with inbox search/status updates, CSV export, secure video links, and SMS/email hand-offs through the coordinator's device.

## Configure Supabase

1. Create a Supabase project.
2. Run `supabase/setup.sql` in the Supabase SQL Editor.
3. In Supabase Authentication, create coordinator accounts with email and password. Disable public sign-ups.
4. Allowlist each coordinator by inserting their Auth user into the database:

   ```sql
   insert into public.campaign_admins (user_id, email)
   select id, email
   from auth.users
   where email = 'coordinator@example.com'
   on conflict (user_id) do update
   set email = excluded.email, active = true;
   ```

5. Keep the `dumle-community-videos` storage bucket private. The SQL setup creates/configures it as private.

## Deploy to Netlify

1. Connect this folder (`dumle-campaign-deploy`) to a Git-backed Netlify site, or deploy it with the Netlify CLI (`netlify deploy --prod`). A drag-and-drop static publish alone will not deploy the Functions. `netlify.toml` sets `public` as the publish directory and `netlify/functions` as the Functions directory.
2. Add these environment variables in Netlify site settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CAMPAIGN_APP_KEY` (a randomly generated secret with at least 32 characters)
3. Never add the Supabase service-role key or campaign app key to public files, browser code, or a committed `.env` file.
4. Deploy the site, then confirm `/api/health` returns `{"ok":true}` and `/admin/` accepts an allowlisted coordinator account.
5. Add the final Netlify domain to Supabase Auth's allowed site URLs.

## Live behavior and limits

- Public follow-up messages, chat exchanges, and video metadata are stored in Supabase. Video files upload directly to the private bucket using short-lived signed URLs; they do not pass through a Netlify function.
- The public chat currently uses conservative, deterministic responses and logs the exchange. It is not a personal message from the Deputy Speaker and does not use a generative AI provider. The `Live` indicator reflects the campaign backend health check.
- Coordinator reply actions open the device's SMS app or email app with a draft. Automated SMS/email delivery is not configured; that requires a chosen provider and credentials.
- Language selection and voice recognition depend on browser support. Common Pidgin, Igbo, Hausa, and Yoruba cues are detected when English is selected; choosing a language explicitly is more reliable for voice. Igbo, Hausa, and Yoruba wording should be checked by fluent speakers. Gokana, Khana, and Eleme chat and voice replies remain pending native-speaker review.
- Set a public privacy notice, data-retention policy, and campaign contact details before accepting real constituent data.
