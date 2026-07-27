UPDATE public.site_settings
SET phone = NULL,
    whatsapp = NULL,
    facebook = 'https://www.facebook.com/profile.php?id=61591763065356',
    about = COALESCE(NULLIF(about, 'أركان — أثاث مصري احترافي بجودة عالية.'), 'بيتك — كل احتياجاتك في مكان واحد: أثاث، أجهزة كهربائية، سيارات، عقارات.')
WHERE id = 1;