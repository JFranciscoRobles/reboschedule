# Paquetes

Cuatro paquetes. Cada uno se apoya en el motor, y en nada más de la suite.

| Paquete | Qué hace | Corre en |
| --- | --- | --- |
| `@reboschedule/core` | El motor: horario, tipos, los horarios libres en cualquier zona horaria, recursos y lugares, precios, las revisiones de una reserva, iCalendar. Sin dependencias. | Navegador y Node |
| `@reboschedule/server` | Las rutas de reserva, como un Request a un Response, y `nodeHandler` para `node:http`. | Node, Workers, Bun |
| `@reboschedule/messages` | Mensajes cortos al teléfono: SMS y WhatsApp con Twilio, WhatsApp con la Cloud API de Meta y plantillas aprobadas. | Node, Workers |
| `@reboschedule/payments` | El cobro de lo apartado: el checkout de Stripe y el de Mercado Pago, sus avisos revisados por firma, reembolsos. | Node, Workers |
| `@reboschedule/calendars` | El calendario propio de quien atiende leído como ocupado: una dirección iCal secreta, el free/busy de Google, la agenda de Outlook. | Node, Workers, navegador |
| `@reboschedule/react` | El widget; el mes, el día y el panel; los editores; la lista. | React 19 |

## Instalar {#installing}

```bash
npm install @reboschedule/core                 # el motor solo
npm install @reboschedule/server               # las rutas
npm install @reboschedule/react                # los componentes
npm install @reboschedule/calendars            # Google, Outlook, iCal
npm install @reboschedule/payments             # Stripe, Mercado Pago
npm install @reboschedule/messages             # WhatsApp, SMS
```

## Versiones {#versions}

Los cuatro van juntos, en la misma versión. ReboSchedule está en la 0.1: lo que se escribe aquí funciona y tiene pruebas, y todavía puede cambiar antes de la 1.0. Ve [Estado y hoja de ruta](/docs/status/).
