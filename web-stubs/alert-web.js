// react-native-web ships `Alert.alert()` as an empty function, so on web every
// dialog in the app silently does nothing — purchases, rewards, confirmations
// and error messages all vanish. That makes the browser useless for testing the
// flows where most of the logic lives.
//
// This renders the same call as a real DOM dialog and invokes the button's
// onPress, so the web build behaves like the phone. metro.config.js only
// substitutes it for platform === 'web'; Android and iOS use the native Alert.

const overlayId = '__rn_alert_overlay';

function close() {
    const el = document.getElementById(overlayId);
    if (el) el.remove();
}

class Alert {
    static alert(title, message, buttons, options) {
        close();

        const list = (buttons && buttons.length) ? buttons : [{ text: 'OK' }];

        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.setAttribute('data-alert', '1');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
            'justify-content:center;background:rgba(0,0,0,.55);font-family:system-ui,sans-serif';

        const box = document.createElement('div');
        box.style.cssText =
            'min-width:260px;max-width:82%;background:#1c1c28;color:#fff;border-radius:14px;' +
            'padding:18px 18px 10px;box-shadow:0 12px 40px rgba(0,0,0,.6)';

        if (title) {
            const h = document.createElement('div');
            h.textContent = title;
            h.setAttribute('data-alert-title', '1');
            h.style.cssText = 'font-size:17px;font-weight:700;margin-bottom:8px';
            box.appendChild(h);
        }
        if (message) {
            const p = document.createElement('div');
            p.textContent = message;
            p.setAttribute('data-alert-message', '1');
            p.style.cssText = 'font-size:14px;line-height:1.35;opacity:.85;margin-bottom:14px;white-space:pre-wrap';
            box.appendChild(p);
        }

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px';
        list.forEach((btn) => {
            const b = document.createElement('button');
            b.textContent = btn.text || 'OK';
            b.setAttribute('data-alert-button', btn.text || 'OK');
            b.style.cssText =
                'appearance:none;border:0;background:transparent;color:' +
                (btn.style === 'destructive' ? '#ff6b6b' : '#4da3ff') +
                ';font-size:15px;font-weight:600;padding:10px 12px;cursor:pointer';
            b.onclick = () => { close(); if (typeof btn.onPress === 'function') btn.onPress(); };
            row.appendChild(b);
        });
        box.appendChild(row);
        overlay.appendChild(box);

        if (options && options.cancelable !== false) {
            overlay.onclick = (e) => {
                if (e.target !== overlay) return;
                close();
                if (typeof options.onDismiss === 'function') options.onDismiss();
            };
        }

        document.body.appendChild(overlay);
    }

    static prompt() { }
}

export default Alert;
