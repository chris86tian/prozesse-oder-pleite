package de.prozesseoderpleite.tv;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView web;
    private long lastBackPress = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_FULLSCREEN);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(7, 11, 20));
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(true);

        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        setContentView(web);
        web.loadUrl("file:///android_asset/web/index.html");
        web.requestFocus();
    }

    private void js(String code, ValueCallback<String> cb) {
        web.evaluateJavascript(code, cb);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        String name = null;
        switch (code) {
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                name = "playpause"; break;
            case KeyEvent.KEYCODE_MENU:
                name = "menu"; break;
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                name = "ff"; break;
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                name = "rw"; break;
            case KeyEvent.KEYCODE_BACK:
                if (event.getAction() == KeyEvent.ACTION_UP) handleBack();
                return true;
        }
        if (name != null) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                js("window.tvKey && window.tvKey('" + name + "')", null);
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void handleBack() {
        js("window.tvBack ? window.tvBack() : false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String handled) {
                if ("true".equals(handled)) return;
                long now = System.currentTimeMillis();
                if (now - lastBackPress < 2000) {
                    finish();
                } else {
                    lastBackPress = now;
                    Toast.makeText(MainActivity.this, "Nochmal Zurück drücken zum Beenden", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
        web.pauseTimers();
    }

    /* Handy: Systemleisten ausblenden (auf dem Fire TV ohne Wirkung) */
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.requestFocus();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
