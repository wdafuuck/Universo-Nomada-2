export const CANCELLATION_CONTACT_EMAIL = "contacto@universonomada.cl";
export const SECURITY_CONTACT_EMAIL = "contacto@universonomada.cl";
export const PRIVACY_CONTACT_EMAIL = "contacto@universonomada.cl";

export type PolicyBlock = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: { title: string; bullets: string[] }[];
  note?: string;
};

export type PolicyDocument = {
  id: string;
  title: string;
  intro?: string;
  blocks: PolicyBlock[];
  contact?: {
    title: string;
    body: string;
    email: string;
  };
};

export const FLIGHT_TERMS: PolicyDocument = {
  id: "vuelos",
  title: "Términos y Condiciones sobre Vuelos",
  blocks: [
    {
      title: "1. Compra de pasajes aéreos",
      paragraphs: [
        "Universo Nómada actúa como intermediario entre el pasajero y las aerolíneas. Los vuelos ofrecidos están sujetos a disponibilidad y a las tarifas vigentes al momento de la cotización y/o reserva.",
      ],
    },
    {
      title: "2. Condiciones del pasaje aéreo",
      bullets: [
        "Todos los pasajes emitidos a través de Universo Nómada son no modificables ni reembolsables en su totalidad, salvo lo expresamente indicado por la aerolínea al momento de la emisión.",
        "Una vez emitido el pasaje, no se permiten cambios de fecha, nombre, horario ni ruta, salvo que la aerolínea lo autorice y el pasajero asuma los cargos correspondientes.",
        "En caso de no presentación (no-show) o cancelación voluntaria por parte del pasajero, se pierde el valor total del pasaje sin derecho a devolución.",
      ],
    },
    {
      title: "3. Vigencia de la tarifa aérea",
      paragraphs: [
        "Las tarifas cotizadas tienen una vigencia limitada, generalmente de 24 horas, y están sujetas a variaciones hasta el momento de la emisión del ticket.",
        "Si no se realiza el pago dentro del plazo informado, la tarifa deberá ser re-cotizada y podría sufrir modificaciones de precio.",
      ],
    },
    {
      title: "4. Responsabilidad de la aerolínea",
      paragraphs: [
        "Universo Nómada no es responsable por cambios en itinerarios, reprogramaciones, cancelaciones, pérdidas de vuelo o cualquier situación atribuible directamente a la aerolínea.",
        "Cualquier compensación o reembolso por parte de la aerolínea deberá gestionarse directamente con esta, según sus propias políticas.",
      ],
    },
    {
      title: "5. Documentación",
      paragraphs: [
        "Es responsabilidad exclusiva del pasajero contar con toda la documentación requerida para volar: cédula de identidad o pasaporte vigente, visas (si aplica), certificados sanitarios, entre otros.",
        "En caso de denegación de embarque por documentación incompleta o incorrecta, no habrá derecho a devolución del pasaje aéreo.",
      ],
    },
  ],
};

export const CANCELLATION_POLICIES: PolicyDocument = {
  id: "cancelacion",
  title: "Políticas de Cancelación",
  intro:
    "En Universo Nómada entendemos que pueden surgir situaciones imprevistas que requieran modificar o cancelar tu viaje. Por ello, hemos establecido las siguientes políticas para garantizar un proceso justo y claro para nuestros viajeros.",
  blocks: [
    {
      title: "1. Cancelación del viaje",
      paragraphs: [
        "La cancelación debe notificarse por escrito al correo electrónico de Universo Nómada y estará sujeta a las siguientes condiciones, según la antelación respecto a la fecha de inicio del tour:",
      ],
      bullets: [
        "Más de 120 días de antelación: reembolso del 80% del primer abono y del 100% de las cuotas siguientes.",
        "Entre 120 y 90 días: reembolso del 60% del primer abono y del 100% de las cuotas siguientes.",
        "Entre 90 y 60 días: reembolso del 40% del primer abono y del 100% de las cuotas siguientes.",
        "Entre 60 y 30 días: reembolso del 20% del primer abono y del 100% de las cuotas siguientes.",
        "Menos de 30 días de antelación: no se reembolsa el primer abono, pero sí el 100% de las cuotas siguientes ya pagadas.",
      ],
      note: "El primer abono corresponde al 50% del valor total del viaje abonado al momento de la reserva.",
    },
    {
      title: "2. No-show (no presentación)",
      paragraphs: [
        "Si el pasajero no se presenta en la fecha y hora estipuladas para el inicio del viaje, no habrá reembolso del primer abono ni de las cuotas pagadas. Esto se considerará una cancelación con menos de 30 días de antelación.",
      ],
    },
    {
      title: "3. Cancelación o retraso del vuelo del pasajero",
      paragraphs: [
        "Si la cancelación o el retraso del vuelo afecta el inicio del tour, aplican las siguientes disposiciones:",
      ],
      bullets: [
        "Evidencia: el pasajero debe presentar documentación oficial emitida por la aerolínea que confirme la cancelación o el retraso, incluyendo causa, itinerario original y confirmación del cambio.",
      ],
      subsections: [
        {
          title: "Retraso del vuelo",
          bullets: [
            "Si el retraso es menor a 12 horas y afecta alguna actividad programada, haremos lo posible por reprogramarla durante el viaje, sujeto a disponibilidad de proveedores y a la programación del tour.",
            "Si el retraso supera las 12 horas y no es posible reprogramar la actividad, no habrá reembolso por las actividades perdidas. Universo Nómada ofrecerá alternativas, en la medida de lo posible, para minimizar el impacto.",
          ],
        },
        {
          title: "Cancelación del vuelo",
          bullets: [
            "Si el vuelo es cancelado por la aerolínea y el pasajero no puede iniciar el tour en la fecha programada, no procederá reembolso del primer abono ni de las cuotas pagadas hasta esa fecha.",
            "El pasajero podrá reagendar el tour, sujeto a disponibilidad, asumiendo un cargo adicional por cambio que cubre costos administrativos y posibles diferencias tarifarias de proveedores.",
            "Las nuevas fechas deben coordinarse con al menos 15 días de anticipación.",
          ],
        },
      ],
    },
    {
      title: "4. Cambios solicitados por el pasajero",
      bullets: [
        "Modificaciones: los cambios en la reserva (fechas, itinerario, etc.) están sujetos a disponibilidad y pueden generar cargos adicionales. Deben solicitarse por escrito con al menos 30 días de antelación.",
        "Cambio de fecha: si se notifica con más de 30 días de antelación, evaluaremos reprogramar el viaje según disponibilidad y sin costo adicional. Con menos de 30 días, el cambio estará sujeto a cargos y disponibilidad de proveedores.",
      ],
    },
    {
      title: "5. Cancelación por parte de Universo Nómada",
      paragraphs: [
        "Si debemos cancelar un viaje por fuerza mayor, condiciones climáticas extremas o cualquier evento que ponga en riesgo la seguridad del pasajero, reembolsaremos el 100% de lo pagado o ofreceremos reprogramar el viaje en una fecha posterior, según disponibilidad.",
      ],
    },
    {
      title: "6. Consideraciones generales",
      bullets: [
        "Comprobantes: todas las cancelaciones y modificaciones deben realizarse por escrito y contar con confirmación de recibo por parte de Universo Nómada.",
        "Tarifas no reembolsables: algunos servicios (boletos aéreos, hoteles u otros) pueden tener políticas propias de proveedores y no siempre serán reembolsables, aunque la cancelación del viaje cumpla con estas políticas.",
        "Seguros de viaje: recomendamos contratar un seguro que cubra cancelaciones o imprevistos antes o durante el viaje.",
      ],
    },
  ],
  contact: {
    title: "Contacto para cancelaciones y modificaciones",
    body: "Para cualquier modificación o cancelación, envía un correo indicando nombre completo, número de reserva y motivo del cambio a:",
    email: CANCELLATION_CONTACT_EMAIL,
  },
};


export const SECURITY_POLICY: PolicyDocument = {
  id: "seguridad",
  title: "Política de Seguridad de la Información",
  intro:
    "En Universo Nómada® la protección de los datos de nuestros viajeros, socios y colaboradores es prioritaria. Esta política describe las medidas técnicas, organizativas y operativas que aplicamos para prevenir accesos no autorizados, fraudes y pérdida de información.",
  blocks: [
    {
      title: "1. Alcance",
      paragraphs: [
        "Aplica a todos los sistemas digitales operados por Universo Nómada®: sitio web universonomada.cl, panel administrativo, APIs de reserva y pago, correos transaccionales y almacenamiento de documentos de viaje.",
      ],
    },
    {
      title: "2. Principios de seguridad",
      bullets: [
        "Confidencialidad: solo personal autorizado accede a datos de reservas, pagos y documentos.",
        "Integridad: los montos, estados de reserva y documentos no pueden modificarse sin autenticación admin.",
        "Disponibilidad: monitoreo y respaldos para mantener el servicio operativo.",
        "Minimización de datos: recolectamos únicamente la información necesaria para cotizar, reservar y operar el viaje.",
      ],
    },
    {
      title: "3. Medidas técnicas implementadas",
      bullets: [
        "Cifrado HTTPS (TLS) en todas las comunicaciones en producción.",
        "Cabeceras de seguridad: CSP, HSTS, X-Frame-Options DENY, nosniff, COOP y CORP.",
        "Sesiones firmadas con HMAC-SHA256; cookies HttpOnly y Secure en producción.",
        "Contraseñas de administradores hasheadas con bcrypt.",
        "Autenticación de miembros mediante OTP por correo (códigos de un solo uso con expiración).",
        "Rate limiting por IP en login, registro, checkout, ruleta, leads y campañas.",
        "Validación de origen (Origin/Referer) en endpoints sensibles en producción.",
        "Bloqueo de rutas de escaneo automatizado (bots, exploits conocidos).",
        "Límite de tamaño de cuerpo JSON en APIs (500 KB máximo).",
        "Sanitización de entradas de usuario antes de persistir o enviar por email.",
        "APIs administrativas protegidas con rol admin y rate limit dedicado.",
        "Cron jobs protegidos con secreto CRON_SECRET.",
        "Variables sensibles solo en servidor (.env), nunca expuestas al cliente.",
      ],
    },
    {
      title: "4. Pagos y datos financieros",
      paragraphs: [
        "No almacenamos números completos de tarjetas. Los pagos con tarjeta se procesan en pasarelas certificadas (SumUp, Transbank, Mercado Pago). Solo conservamos referencias de transacción, montos y estados para conciliación.",
      ],
      bullets: [
        "Transferencias bancarias: publicamos datos de cuenta oficial; el comprobante lo envía el cliente por canal acordado.",
        "Webhooks de pago validados contra APIs oficiales de cada proveedor.",
      ],
    },
    {
      title: "5. Documentos de viaje",
      bullets: [
        "Los PDF de viaje se almacenan en servidor con acceso restringido al titular de la reserva autenticado.",
        "Expiración automática de descarga 90 días (3 meses) después del fin del viaje.",
        "Solo administradores autorizados pueden subir o eliminar documentos.",
      ],
    },
    {
      title: "6. Respuesta a incidentes",
      bullets: [
        "Detección: monitoreo de intentos de fuerza bruta, picos anómalos de tráfico y errores de autenticación.",
        "Contención: bloqueo por rate limit y revocación de sesiones comprometidas.",
        "Notificación: en caso de brecha que afecte datos personales, informaremos a usuarios afectados y autoridades según la ley chilena aplicable.",
        "Mejora continua: rotación periódica de secretos (SESSION_SECRET, CRON_SECRET, claves API).",
      ],
    },
    {
      title: "7. Responsabilidades del usuario",
      bullets: [
        "Mantener confidencialidad del código OTP enviado a su correo.",
        "No compartir enlaces de confirmación de pago con terceros.",
        "Reportar actividad sospechosa a contacto@universonomada.cl.",
      ],
    },
    {
      title: "8. Cumplimiento",
      paragraphs: [
        "Operamos conforme a la Ley N° 19.628 sobre Protección de la Vida Privada (Chile) y buenas prácticas de la industria turística. Estamos registrados ante SERNATUR como operador turístico.",
      ],
    },
  ],
  contact: {
    title: "Reporte de vulnerabilidades o incidentes",
    body: "Si detectas un problema de seguridad, escríbenos de inmediato indicando descripción, URL afectada y pasos para reproducir:",
    email: SECURITY_CONTACT_EMAIL,
  },
};

export const PRIVACY_POLICY: PolicyDocument = {
  id: "privacidad",
  title: "Política de Privacidad",
  intro:
    "Universo Nómada® respeta tu privacidad. Esta política explica qué datos recopilamos, para qué los usamos y cuáles son tus derechos.",
  blocks: [
    {
      title: "1. Responsable del tratamiento",
      paragraphs: [
        "Universo Nómada®, con domicilio en Calle Reñaca Norte 265, Viña del Mar, Chile. Contacto: contacto@universonomada.cl.",
      ],
    },
    {
      title: "2. Datos que recopilamos",
      bullets: [
        "Identificación: nombre, email, teléfono, RUT o pasaporte (cuando aplica).",
        "Reserva: destino, fechas, pasajeros, preferencias de alojamiento y vuelo.",
        "Pago: método elegido, montos, estado de abonos (sin datos completos de tarjeta).",
        "Navegación: cookies técnicas, idioma preferido, eventos analíticos anonimizados (GA4/Meta Pixel si aceptas cookies de medición).",
        "Comunicaciones: mensajes de contacto, suscripción al blog y premios de ruleta vinculados a email.",
      ],
    },
    {
      title: "3. Finalidad del tratamiento",
      bullets: [
        "Cotizar, reservar y operar tu viaje.",
        "Enviar confirmaciones, recordatorios de pago y documentos.",
        "Gestionar tu cuenta Nómada, beneficios y Pasaporte Nómada.",
        "Cumplir obligaciones legales y contables.",
        "Mejorar nuestros servicios y campañas (con tu consentimiento cuando corresponda).",
      ],
    },
    {
      title: "4. Base legal",
      paragraphs: [
        "Ejecución del contrato de viaje, consentimiento informado para marketing y suscripción al blog, e interés legítimo en seguridad y prevención de fraude.",
      ],
    },
    {
      title: "5. Conservación",
      bullets: [
        "Datos de reserva: mientras dure la relación comercial y plazos legales posteriores.",
        "Documentos de viaje descargables: hasta 90 días (3 meses) después del fin del viaje.",
        "Códigos OTP: minutos; no se almacenan en texto plano.",
        "Carrito abandonado: hasta completar compra o solicitud de eliminación.",
      ],
    },
    {
      title: "6. Compartición con terceros",
      bullets: [
        "Proveedores de pago (SumUp, Transbank, Mercado Pago).",
        "Proveedores de email (Resend/SMTP).",
        "APIs de hoteles y disponibilidad (LiteAPI, RateHawk) — solo datos necesarios para cotizar.",
        "No vendemos ni alquilamos tus datos personales.",
      ],
    },
    {
      title: "7. Tus derechos",
      bullets: [
        "Acceder, rectificar o eliminar tus datos.",
        "Oponerte al tratamiento con fines de marketing.",
        "Portabilidad cuando sea técnicamente posible.",
        "Ejercer derechos escribiendo a contacto@universonomada.cl con asunto «Privacidad».",
      ],
    },
    {
      title: "8. Seguridad",
      paragraphs: [
        "Aplicamos cifrado, control de acceso, autenticación reforzada y monitoreo. Consulta nuestra Política de Seguridad para el detalle técnico.",
      ],
    },
    {
      title: "9. Menores",
      paragraphs: [
        "Los menores deben reservar con autorización de su representante legal. No recopilamos datos de menores de forma independiente sin consentimiento parental.",
      ],
    },
    {
      title: "10. Cambios",
      paragraphs: [
        "Podemos actualizar esta política. La fecha de vigencia se indica al pie de esta página.",
      ],
    },
  ],
  contact: {
    title: "Consultas de privacidad",
    body: "Para ejercer tus derechos o consultas sobre privacidad:",
    email: PRIVACY_CONTACT_EMAIL,
  },
};

export const TERMS_CONDITIONS: PolicyDocument = {
  id: "terminos",
  title: "Términos y Condiciones Generales",
  intro:
    "Al utilizar el sitio universonomada.cl, registrarte como miembro Nómada o contratar un viaje con Universo Nómada®, aceptas estos términos.",
  blocks: [
    {
      title: "1. Servicios",
      paragraphs: [
        "Universo Nómada® es una agencia de viajes boutique que ofrece paquetes turísticos, experiencias personalizadas y salidas grupales en Chile y Sudamérica. Las descripciones, precios «desde» y disponibilidad están sujetas a confirmación al momento de la reserva.",
      ],
    },
    {
      title: "2. Cotizaciones y reservas",
      bullets: [
        "Los precios en el sitio son referenciales hasta confirmar fechas, cupos y tarifas aéreas/hotel.",
        "La reserva se perfecciona con el abono indicado y confirmación escrita de Universo Nómada®.",
        "El cliente es responsable de la veracidad de los datos entregados.",
      ],
    },
    {
      title: "3. Pagos",
      bullets: [
        "Métodos disponibles: tarjeta (SumUp u otros habilitados), transferencia bancaria y pasarelas locales.",
        "Plazos de transferencia: según condiciones indicadas en la confirmación de reserva.",
        "Los saldos pendientes deben regularizarse según el plan de pago acordado.",
      ],
    },
    {
      title: "4. Cancelaciones y modificaciones",
      paragraphs: [
        "Rigen las Políticas de Cancelación publicadas en este sitio. Los vuelos tienen condiciones adicionales en Términos sobre Vuelos.",
      ],
    },
    {
      title: "5. Cuenta Nómada",
      bullets: [
        "El acceso es personal e intransferible.",
        "Los beneficios y cupones tienen restricciones de elegibilidad publicadas en Mi cuenta.",
        "Universo Nómada® puede suspender cuentas con uso fraudulento o abuso de promociones.",
      ],
    },
    {
      title: "6. Propiedad intelectual",
      paragraphs: [
        "Textos, imágenes, marca y diseño del sitio son propiedad de Universo Nómada® o sus licenciantes. Queda prohibida su reproducción sin autorización.",
      ],
    },
    {
      title: "7. Limitación de responsabilidad",
      bullets: [
        "No somos responsables por hechos de terceros (aerolíneas, hoteles, clima, fuerza mayor).",
        "Recomendamos seguro de viaje para imprevistos médicos, cancelaciones o equipaje.",
        "El sitio puede contener enlaces a terceros; sus políticas son independientes.",
      ],
    },
    {
      title: "8. Ley aplicable y jurisdicción",
      paragraphs: [
        "Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales competentes de Valparaíso, sin perjuicio de derechos del consumidor.",
      ],
    },
  ],
  contact: {
    title: "Consultas legales",
    body: "Para dudas sobre estos términos:",
    email: CANCELLATION_CONTACT_EMAIL,
  },
};

export const LEGAL_POLICIES = [FLIGHT_TERMS, CANCELLATION_POLICIES, SECURITY_POLICY, PRIVACY_POLICY, TERMS_CONDITIONS] as const;
