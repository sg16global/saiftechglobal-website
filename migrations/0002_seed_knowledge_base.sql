-- Initial verified knowledge base, taken only from facts already published on saiftechglobal.com
-- and the owner's Working Mode specification. Staff can edit/extend it in Admin Panel → Knowledge base.

INSERT INTO kb_docs (id, scope, title, body, verified, updated_at, updated_by) VALUES
('kb_company_overview', 'company', 'Saif Tech Global LLC — company overview',
'Saif Tech Global LLC is a USA technology company registered in New Mexico (Entity ID 0008128993), located at 8206 Louisiana Blvd NE, Ste A #10595, Albuquerque, NM 87113. Contact: contact@saiftechglobal.com. Website: saiftechglobal.com.
The company develops AI platforms, financial intelligence, and live geopolitical monitoring for users worldwide. Its SG16 ecosystem currently has six live platforms: SG16 AI Engine (sg16engine.com), SG16 Finance (sg16finance.com), SG16 Children World (sg16children.com), SG16 Geopolitical Monitor (saifglobal16.info), SG16 Ads Network (ads.saiftechglobal.com) and SG16 Identifier (sg16identifier.com). Each product runs on its own domain.
The company also offers custom technology development through Working Mode (saiftechglobal.com/working-mode) and a Centralized 24/7 AI Helpline for all its platforms (saiftechglobal.com/helpline).',
1, unixepoch(), 'seed'),

('kb_services_catalog', 'services', 'Working Mode — development services offered',
'Through Working Mode, Saif Tech Global LLC accepts requests for: custom software development; website development; mobile application development (iOS and Android); AI agent development; AI automation systems; business management software; API integrations; enterprise solutions; and other supported technology services.
Every request starts with an AI consultation that collects requirements, followed by a technical specification, an estimate from the company pricing engine, and a proposal.',
1, unixepoch(), 'seed'),

('kb_services_process', 'services', 'How Working Mode works (AI-operated)',
'Saif Tech Global LLC is an AI-operated company. Working Mode is run end to end by the company AI, 24/7:
1) Conversation: the AI greets the client and learns the idea, goals, users and must-have features.
2) Project brief: the AI writes a structured brief and asks the client to confirm it ("Is this what you had in mind?"). Nothing proceeds until the client confirms.
3) Design: for anything with a screen, the AI shows a visual mock-up; for other work it shows a solution outline. The client approves it or asks for changes.
4) Price: the AI prices the work by its real value and effort (minimum order $10, no upper limit). Small fixes cost little; large systems cost more. The price comes with a short explanation.
5) Payment: the client signs in with an email code and pays the full price securely online. Payment is verified with the payment provider before work starts.
6) Build and test: the AI writes the code and runs the acceptance tests that were fixed before coding started. If tests fail, it fixes and re-runs them automatically, up to three more times.
7) Delivery or refund: if the tests pass, the client downloads the delivery and receives a lifetime membership token (STG-M-...). If the tests still fail after the retries, the client is refunded automatically.
Automatic builds currently cover web and JavaScript/Node.js work (websites, web apps, APIs, scripts and tools). For other platforms the AI offers a buildable alternative instead of charging for work it cannot verify.',
1, unixepoch(), 'seed'),

('kb_services_pricing', 'services', 'Pricing policy (AI-set)',
'Prices are set by the company AI from the approved brief and design: real value to the client plus the effort to build and test it. The minimum order is $10 and there is no upper limit. The price is fixed once quoted (valid 14 days) and is paid in full before the build starts. If the company AI cannot deliver work that passes its acceptance tests, the payment is refunded automatically. The AI does not negotiate prices in chat; to lower the price, the scope must be reduced.',
1, unixepoch(), 'seed'),

('kb_company_helpline', 'company', 'Getting help (24/7)',
'The Centralized 24/7 AI Helpline supports every user of every Saif Tech Global platform at any hour. It answers from verified documentation and opens tickets that the company AI answers immediately, day and night. Clients who received a delivery from Working Mode hold a lifetime membership token (STG-M-...) and get lifetime priority support from an AI that knows their delivered project in full. The AI cannot see passwords or card details and cannot change accounts on other platforms.',
1, unixepoch(), 'seed'),

('kb_engine_overview', 'engine', 'SG16 AI Engine — overview',
'SG16 AI Engine (sg16engine.com) is the flagship multi-workspace AI platform of Saif Tech Global LLC for chat, coding, documents, images and more. It offers five dedicated shields: Coding Hub, Health, Student, Market and AI Chat. It runs on the company sovereign cloud brain (api.mistralbrain.com, 24/7). Zero-Data Trace policy: chat content is processed live to produce a reply and is not stored on company servers; history is kept on the user device. Sign-in is with Google. Coding Shield and Platform Shield security tools are included.',
1, unixepoch(), 'seed'),

('kb_finance_overview', 'finance', 'SG16 Finance — overview',
'SG16 Finance (sg16finance.com) offers institutional-grade market intelligence: global indices, sector research and plain-English earnings breakdowns. It has a live dashboard with a world market map and tickers. Content is educational intelligence for global investors and is not personal financial advice.',
1, unixepoch(), 'seed'),

('kb_children_overview', 'children', 'SG16 Children World — overview',
'SG16 Children World (sg16children.com) is a parent-gated learning world where kids chat with Robo, a friendly AI helper. It has a Robo assistant for ages 6–11, teens and adults with tiered safety, a parent gate, age tiers and kid-safe chat rules, plus homework help, stories, science facts and gentle support.',
1, unixepoch(), 'seed'),

('kb_geo_overview', 'geo', 'SG16 Geopolitical Monitor — overview',
'SG16 Geopolitical Monitor (saifglobal16.info) is a live world command map showing tension zones, flights, markets, earthquakes and breaking geopolitical updates in one view, in a deep-black and red-neon design. It is free on PC, Android and iOS (add it to the home screen) and uses open data feeds for quakes, news, finance and flights.',
1, unixepoch(), 'seed'),

('kb_ads_overview', 'ads', 'SG16 Ads Network — overview',
'SG16 Ads Network (ads.saiftechglobal.com) lets advertisers pick a package, upload their brand, have AI build the ad creative, pay with Dodo Payments and go live automatically. Packages start from $3 (Standard, Premium and Pro). AI ad designs can be made from the advertiser website or an upload. Checkout is secure via Dodo with Gmail sign-in and instant activation.',
1, unixepoch(), 'seed'),

('kb_identifier_overview', 'identifier', 'SG16 Identifier — overview',
'SG16 Identifier (sg16identifier.com) helps people verify products, news, websites and media with evidence behind every result.',
1, unixepoch(), 'seed');
