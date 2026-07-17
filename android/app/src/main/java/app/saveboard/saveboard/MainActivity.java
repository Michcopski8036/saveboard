package app.saveboard.saveboard;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Edge-to-edge (required on targetSdk 35+; opt-out is unavailable at 36).
    // Let the WebView draw behind the transparent system bars so the web layer
    // paints the status-bar area itself (via CSS env(safe-area-inset-*) padding
    // on the header / nav) — that keeps the bar background correct in both light
    // and dark themes. Here we only make the window edge-to-edge and set the
    // status-bar icon colour to match the current theme so icons stay legible.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        applySystemBarIconColors();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applySystemBarIconColors();
    }

    private void applySystemBarIconColors() {
        boolean isDark = (getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        // Light bars (dark icons) on a light theme; dark bars (light icons) in dark mode.
        controller.setAppearanceLightStatusBars(!isDark);
        controller.setAppearanceLightNavigationBars(!isDark);
    }

    // Android share-target: the SEND intent-filter is on this (singleTask) activity.
    // When the app is already running/backgrounded the share arrives via onNewIntent,
    // so we must (1) replace the activity's intent so SendIntent.checkSendIntentReceived()
    // reads the NEW shared link (it reads getActivity().getIntent()), and (2) tell the
    // web layer to re-check by dispatching the `sendIntentReceived` event App.tsx listens for.
    // Without this, only cold-start shares worked.
    @Override
    protected void onNewIntent(Intent intent) {
        setIntent(intent);
        super.onNewIntent(intent);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('sendIntentReceived'))", null));
        }
    }
}
