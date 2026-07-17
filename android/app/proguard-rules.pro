# ============================================================================
# SaveBoard R8 / ProGuard rules
# R8 (minifyEnabled) is on for release. Capacitor loads its bridge and every
# plugin by class name via reflection, so those classes MUST be kept or the
# release build crashes at runtime (never in debug). These rules keep the
# bridge, all plugins, JS interfaces, and readable crash traces.
# ============================================================================

# --- Readable stack traces even with obfuscation (pairs with the uploaded
#     mapping.txt so Play Console can de-obfuscate crashes/ANRs) ---
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,Exceptions
-renamesourcefileattribute SourceFile

# --- Capacitor core bridge ---
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# --- Every Capacitor plugin (package-agnostic: they extend Plugin and/or carry
#     the @CapacitorPlugin annotation, and their @PluginMethod methods are
#     invoked reflectively from JS) ---
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# --- WebView JavaScript interface ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Cordova compat layer bundled by Capacitor ---
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# --- Installed plugins (explicit keeps as extra safety on top of the generic
#     rules above) ---
-keep class com.capacitorjs.plugins.app.** { *; }
-keep class com.capacitorjs.plugins.browser.** { *; }
-keep class com.capacitorjs.plugins.keyboard.** { *; }
-keep class com.getcapacitor.community.applesignin.** { *; }
-keep class com.getcapacitor.community.inappreview.** { *; }
-keep class de.mindlib.sendIntent.** { *; }

# --- App entry point ---
-keep class app.saveboard.saveboard.** { *; }

# --- Silence notes for optional/reflective deps commonly pulled in ---
-dontwarn org.apache.cordova.**
-dontwarn com.getcapacitor.**
