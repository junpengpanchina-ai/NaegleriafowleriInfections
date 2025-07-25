// 翻译系统
class TranslationSystem {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferred-language') || 'en';
        this.translations = {
            en: {
                // 页面标题和基本信息
                pageTitle: 'Naegleria fowleri Infection | CDC',
                metaDescription: 'Learn about Naegleria fowleri infections, symptoms, prevention, and treatment from the CDC.',
                mainTitle: 'Naegleria fowleri Infection',
                pageSubtitle: 'Naegleria fowleri Infections',
                
                // 头部导航
                govBannerText: 'An official website of the United States government',
                govBannerToggle: 'Here\'s how you know',
                govInfoOfficial: 'Official websites use .gov',
                govInfoOfficialDesc: 'A .gov website belongs to an official government organization in the United States.',
                govInfoSecure: 'Secure .gov websites use HTTPS',
                govInfoSecureDesc: 'A lock icon or https:// means you\'ve safely connected to the .gov website.',
                exploreTopicBtn: 'EXPLORE THIS TOPIC',
                searchPlaceholder: 'Search CDC',
                searchBtn: 'SEARCH',
                
                // 导航菜单
                forEveryone: 'For Everyone',
                healthcareProviders: 'Health Care Providers',
                publicHealth: 'Public Health',
                about: 'About',
                symptoms: 'Symptoms',
                causes: 'Causes',
                prevention: 'Prevention',
                treatment: 'Treatment',
                riskFactors: 'Risk Factors',
                clinicalFeatures: 'Clinical Features',
                diagnosis: 'Clinical Testing and Diagnosis',
                clinicalCare: 'Clinical Care',
                treatmentProtocols: 'Treatment Protocols',
                caseManagement: 'Case Management',
                differentialDiagnosis: 'Differential Diagnosis',
                guidance: 'Guidance',
                surveillance: 'Surveillance',
                outbreakResponse: 'Outbreak Response',
                preventionPrograms: 'Prevention Programs',
                dataStatistics: 'Data & Statistics',
                research: 'Research',
                viewAll: 'VIEW ALL',
                
                // 相关主题
                relatedTopics: 'Related Topics:',
                acanthamoebaInfections: 'Acanthamoeba Infections',
                recreationalWaterSafety: 'Recreational Water Safety',
                parasiticDiseases: 'Parasitic Diseases',
                
                // 日期和标签
                audienceTag: 'For Everyone',
                spanishLink: 'ESPAÑOL',
                
                // 主要内容
                keyPoints: 'KEY POINTS',
                moreInformation: 'MORE INFORMATION',
                keyPoint1: 'Naegleria fowleri is a free-living amoeba, a kind of one-celled organism that thrives in warm freshwater lakes, rivers, and hot springs.',
                keyPoint2: 'It is often called the "brain-eating amoeba" because it can infect the brain and destroy brain tissue.',
                keyPoint3: 'Brain infections caused by Naegleria fowleri are very rare but nearly always fatal.',
                
                // 症状部分  
                symptomsTitle: 'Symptoms and Diagnosis',
                symptomsDescription: 'Initial symptoms of PAM (Primary Amebic Meningoencephalitis) start about 5 days after infection and may include:',
                symptom1: 'Headache',
                symptom2: 'Fever',
                symptom3: 'Nausea or vomiting',
                symptom4: 'Stiff neck',
                laterSymptoms: 'Later symptoms may include seizures, altered mental status, hallucinations, and focal neurologic deficits.',
                
                // 预防部分
                preventionTitle: 'Prevention',
                preventionDescription: 'You can reduce your risk by following these prevention tips:',
                prevention1: 'Avoid jumping or diving into warm freshwater',
                prevention2: 'Hold your nose shut or use nose clips when jumping or diving',
                prevention3: 'Avoid putting your head underwater in hot springs and thermally-polluted water',
                prevention4: 'Avoid water activities in warm freshwater during periods of high water temperature',
                
                // 治疗部分
                treatmentTitle: 'Treatment',
                treatmentDescription: 'Treatment for PAM is difficult because the infection progresses rapidly. Several drugs have shown promise in laboratory studies, including:',
                treatment1: 'Amphotericin B',
                treatment2: 'Azithromycin',
                treatment3: 'Fluconazole',
                treatment4: 'Rifampin',
                treatment5: 'Miltefosine',
                treatmentNote: 'Early diagnosis and treatment are critical. If you have symptoms after recent freshwater activities, seek medical attention immediately.',
                
                // 统计数据
                statisticsTitle: 'Statistics and Surveillance',
                totalCases: 'Total cases in the U.S. (1962-2021)',
                fatalityRate: 'Case fatality rate',
                survivors: 'Known survivors worldwide',
                summerNote: 'Most infections occur during the summer months when water temperatures are highest.',
                
                // 内容部分标题
                aboutTitle: 'ABOUT NAEGLERIA FOWLERI',
                causesTitle: 'CAUSES & TRANSMISSION',
                clinicalFeaturesTitle: 'CLINICAL FEATURES',
                clinicalTestingTitle: 'CLINICAL TESTING & DIAGNOSIS',
                publicHealthGuidanceTitle: 'PUBLIC HEALTH GUIDANCE',
                dataStatisticsTitle: 'DATA & STATISTICS',
                resourcesTitle: 'RESOURCES',
                latestArticlesTitle: 'LATEST ARTICLES & UPDATES',
                
                // 侧边栏
                quickLinks: 'Quick Links',
                overview: 'Overview',
                resources: 'Resources',
                relatedTopicsTitle: 'Related Topics',
                allRelatedTopics: 'All Related Topics',
                recentArticles: 'Recent Articles',
                stayInformed: 'Stay Informed',
                emailUpdates: 'Get email updates about this topic',
                emailPlaceholder: 'Enter your email',
                subscribe: 'Subscribe',
                shareThisPage: 'Share This Page',
                
                // 文章相关
                viewAllArticles: 'View All Articles →',
                noArticles: 'No published articles yet',
                goToAdmin: 'Go to admin panel',
                publishFirstArticle: 'to publish your first article',
                loading: 'Loading...',
                loadingArticles: '📝 Loading latest articles...',
                
                // 页脚
                aboutCDC: 'About CDC',
                mission: 'Mission',
                leadership: 'Leadership',
                organization: 'Organization',
                jobs: 'Jobs',
                policies: 'Policies',
                privacyPolicy: 'Privacy Policy',
                accessibility: 'Accessibility',
                foia: 'FOIA',
                qualityStandards: 'Quality Standards',
                connect: 'Connect',
                contactUs: 'Contact Us',
                emailUpdatesFooter: 'Email Updates',
                socialMedia: 'Social Media',
                mobileApp: 'Mobile App',
                languages: 'Languages',
                copyright: '© 2025 Centers for Disease Control and Prevention. All rights reserved.',
                department: 'U.S. Department of Health & Human Services | CDC',
                
                // 共享按钮
                facebook: 'Facebook',
                twitter: 'Twitter',
                linkedin: 'LinkedIn',
                print: 'Print'
            },
            es: {
                // 页面标题和基本信息
                pageTitle: 'Infección por Naegleria fowleri | CDC',
                metaDescription: 'Aprenda sobre las infecciones por Naegleria fowleri, síntomas, prevención y tratamiento del CDC.',
                mainTitle: 'Infección por Naegleria fowleri',
                pageSubtitle: 'Infecciones por Naegleria fowleri',
                
                // 头部导航
                govBannerText: 'Un sitio web oficial del gobierno de los Estados Unidos',
                govBannerToggle: 'Así es como usted puede verificarlo',
                govInfoOfficial: 'Los sitios web oficiales usan .gov',
                govInfoOfficialDesc: 'Un sitio web .gov pertenece a una organización oficial del gobierno de Estados Unidos.',
                govInfoSecure: 'Los sitios web seguros .gov usan HTTPS',
                govInfoSecureDesc: 'Un candado o https:// significa que usted se conectó de forma segura a un sitio web .gov.',
                exploreTopicBtn: 'EXPLORAR ESTE TEMA',
                searchPlaceholder: 'Buscar CDC',
                searchBtn: 'BUSCAR',
                
                // 导航菜单
                forEveryone: 'Para Todos',
                healthcareProviders: 'Proveedores de Atención Médica',
                publicHealth: 'Salud Pública',
                about: 'Acerca de',
                symptoms: 'Síntomas',
                causes: 'Causas',
                prevention: 'Prevención',
                treatment: 'Tratamiento',
                riskFactors: 'Factores de Riesgo',
                clinicalFeatures: 'Características Clínicas',
                diagnosis: 'Pruebas Clínicas y Diagnóstico',
                clinicalCare: 'Atención Clínica',
                treatmentProtocols: 'Protocolos de Tratamiento',
                caseManagement: 'Manejo de Casos',
                differentialDiagnosis: 'Diagnóstico Diferencial',
                guidance: 'Orientación',
                surveillance: 'Vigilancia',
                outbreakResponse: 'Respuesta a Brotes',
                preventionPrograms: 'Programas de Prevención',
                dataStatistics: 'Datos y Estadísticas',
                research: 'Investigación',
                viewAll: 'VER TODO',
                
                // 相关主题
                relatedTopics: 'Temas Relacionados:',
                acanthamoebaInfections: 'Infecciones por Acanthamoeba',
                recreationalWaterSafety: 'Seguridad del Agua Recreativa',
                parasiticDiseases: 'Enfermedades Parasitarias',
                
                // 日期和标签
                audienceTag: 'Para Todos',
                spanishLink: 'ENGLISH',
                
                // 主要内容
                keyPoints: 'PUNTOS CLAVE',
                moreInformation: 'MÁS INFORMACIÓN',
                keyPoint1: 'Naegleria fowleri es una ameba de vida libre, un tipo de organismo unicelular que prospera en lagos, ríos y aguas termales de agua dulce tibia.',
                keyPoint2: 'A menudo se le llama la "ameba comecerebros" porque puede infectar el cerebro y destruir el tejido cerebral.',
                keyPoint3: 'Las infecciones cerebrales causadas por Naegleria fowleri son muy raras pero casi siempre mortales.',
                
                // 症状部分
                symptomsTitle: 'Síntomas y Diagnóstico',
                symptomsDescription: 'Los síntomas iniciales de MAP (Meningoencefalitis Amebiana Primaria) comienzan aproximadamente 5 días después de la infección y pueden incluir:',
                symptom1: 'Dolor de cabeza',
                symptom2: 'Fiebre',
                symptom3: 'Náuseas o vómitos',
                symptom4: 'Rigidez del cuello',
                laterSymptoms: 'Los síntomas posteriores pueden incluir convulsiones, estado mental alterado, alucinaciones y déficits neurológicos focales.',
                
                // 预防部分
                preventionTitle: 'Prevención',
                preventionDescription: 'Puede reducir su riesgo siguiendo estos consejos de prevención:',
                prevention1: 'Evite saltar o zambullirse en agua dulce tibia',
                prevention2: 'Mantenga la nariz cerrada o use pinzas nasales al saltar o zambullirse',
                prevention3: 'Evite poner la cabeza bajo el agua en aguas termales y agua contaminada térmicamente',
                prevention4: 'Evite actividades acuáticas en agua dulce tibia durante períodos de alta temperatura del agua',
                
                // 治疗部分
                treatmentTitle: 'Tratamiento',
                treatmentDescription: 'El tratamiento para MAP es difícil porque la infección progresa rápidamente. Varios medicamentos han mostrado promesa en estudios de laboratorio, incluyendo:',
                treatment1: 'Anfotericina B',
                treatment2: 'Azitromicina',
                treatment3: 'Fluconazol',
                treatment4: 'Rifampina',
                treatment5: 'Miltefosina',
                treatmentNote: 'El diagnóstico y tratamiento temprano son críticos. Si tiene síntomas después de actividades recientes en agua dulce, busque atención médica inmediatamente.',
                
                // 统计数据
                statisticsTitle: 'Estadísticas y Vigilancia',
                totalCases: 'Casos totales en EE.UU. (1962-2021)',
                fatalityRate: 'Tasa de letalidad',
                survivors: 'Sobrevivientes conocidos mundialmente',
                summerNote: 'La mayoría de las infecciones ocurren durante los meses de verano cuando las temperaturas del agua son más altas.',
                
                // 内容部分标题
                aboutTitle: 'ACERCA DE NAEGLERIA FOWLERI',
                causesTitle: 'CAUSAS Y TRANSMISIÓN',
                clinicalFeaturesTitle: 'CARACTERÍSTICAS CLÍNICAS',
                clinicalTestingTitle: 'PRUEBAS CLÍNICAS Y DIAGNÓSTICO',
                publicHealthGuidanceTitle: 'ORIENTACIÓN DE SALUD PÚBLICA',
                dataStatisticsTitle: 'DATOS Y ESTADÍSTICAS',
                resourcesTitle: 'RECURSOS',
                latestArticlesTitle: 'ÚLTIMOS ARTÍCULOS Y ACTUALIZACIONES',
                
                // 侧边栏
                quickLinks: 'Enlaces Rápidos',
                overview: 'Resumen',
                resources: 'Recursos',
                relatedTopicsTitle: 'Temas Relacionados',
                allRelatedTopics: 'Todos los Temas Relacionados',
                recentArticles: 'Artículos Recientes',
                stayInformed: 'Manténgase Informado',
                emailUpdates: 'Reciba actualizaciones por correo electrónico sobre este tema',
                emailPlaceholder: 'Ingrese su correo electrónico',
                subscribe: 'Suscribirse',
                shareThisPage: 'Compartir Esta Página',
                
                // 文章相关
                viewAllArticles: 'Ver Todos los Artículos →',
                noArticles: 'Aún no hay artículos publicados',
                goToAdmin: 'Ir al panel de administración',
                publishFirstArticle: 'para publicar su primer artículo',
                loading: 'Cargando...',
                loadingArticles: '📝 Cargando últimos artículos...',
                
                // 页脚
                aboutCDC: 'Acerca de CDC',
                mission: 'Misión',
                leadership: 'Liderazgo',
                organization: 'Organización',
                jobs: 'Empleos',
                policies: 'Políticas',
                privacyPolicy: 'Política de Privacidad',
                accessibility: 'Accesibilidad',
                foia: 'FOIA',
                qualityStandards: 'Estándares de Calidad',
                connect: 'Conectar',
                contactUs: 'Contáctenos',
                emailUpdatesFooter: 'Actualizaciones por Correo',
                socialMedia: 'Redes Sociales',
                mobileApp: 'Aplicación Móvil',
                languages: 'Idiomas',
                copyright: '© 2025 Centros para el Control y la Prevención de Enfermedades. Todos los derechos reservados.',
                department: 'Departamento de Salud y Servicios Humanos de EE.UU. | CDC',
                
                // 共享按钮
                facebook: 'Facebook',
                twitter: 'Twitter',
                linkedin: 'LinkedIn',
                print: 'Imprimir'
            }
        };
        
        this.init();
    }
    
    init() {
        this.updateLanguageButtons();
        this.translatePage();
        this.bindEvents();
    }
    
    bindEvents() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = button.getAttribute('data-lang');
                this.switchLanguage(lang);
            });
        });
    }
    
    switchLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('preferred-language', lang);
            this.updateLanguageButtons();
            this.translatePage();
            
            // 触发语言切换事件
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: lang }
            }));
            
            console.log(`语言已切换到: ${lang === 'en' ? '英语' : '西班牙语'}`);
        }
    }
    
    updateLanguageButtons() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-lang') === this.currentLanguage) {
                button.classList.add('active');
            }
        });
    }
    
    translatePage() {
        const translations = this.translations[this.currentLanguage];
        
        // 更新页面标题和meta信息
        document.title = translations.pageTitle;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', translations.metaDescription);
        }
        
        // 翻译所有带有data-translate属性的元素
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
        
        // 翻译所有带有data-translate-html属性的元素（支持HTML内容）
        document.querySelectorAll('[data-translate-html]').forEach(element => {
            const key = element.getAttribute('data-translate-html');
            if (translations[key]) {
                element.innerHTML = translations[key];
            }
        });
        
        // 特殊处理：根据语言更新西班牙语链接
        const spanishLinks = document.querySelectorAll('.spanish-link');
        spanishLinks.forEach(link => {
            if (this.currentLanguage === 'es') {
                link.textContent = translations.spanishLink;
                link.href = '#';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchLanguage('en');
                });
            } else {
                link.textContent = translations.spanishLink;
                link.href = '#';
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchLanguage('es');
                });
            }
        });
        
        console.log(`页面已翻译为: ${this.currentLanguage === 'en' ? '英语' : '西班牙语'}`);
    }
    
    getText(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// 全局翻译系统实例
window.translationSystem = new TranslationSystem(); 