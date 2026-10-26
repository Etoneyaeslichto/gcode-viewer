package ru.cnc.gcodeviewer;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final int PICK_FILE = 1;
    private static final String SUBDIR = "CNC";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(0xFF1C1C1A);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = callback;
                cameraUri = null;
                boolean image = false;
                String[] types = params.getAcceptTypes();
                if (types != null) {
                    for (String t : types) {
                        if (t != null && t.startsWith("image")) {
                            image = true;
                        }
                    }
                }
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType(image ? "image/*" : "*/*");
                Intent chooser = Intent.createChooser(pick, image ? "Фото чертежа" : "Открыть файл");
                if (image && Build.VERSION.SDK_INT >= 29) {
                    try {
                        ContentValues v = new ContentValues();
                        v.put(MediaStore.Images.Media.DISPLAY_NAME, "chertezh_" + System.currentTimeMillis() + ".jpg");
                        v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                        v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + SUBDIR);
                        cameraUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                        if (cameraUri != null) {
                            Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                            cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                            cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                        }
                    } catch (Exception e) {
                        cameraUri = null;
                    }
                }
                try {
                    startActivityForResult(chooser, PICK_FILE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILE || fileCallback == null) {
            return;
        }
        Uri[] result = null;
        boolean fromPicker = data != null && (data.getData() != null || data.getClipData() != null);
        if (resultCode == RESULT_OK) {
            if (fromPicker) {
                result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            } else if (cameraUri != null) {
                result = new Uri[]{cameraUri};
            }
        }
        if (cameraUri != null && (result == null || fromPicker)) {
            try {
                getContentResolver().delete(cameraUri, null, null);
            } catch (Exception ignored) {
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
        cameraUri = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private static String readAll(InputStream in) throws Exception {
        if (in == null) {
            return "";
        }
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) {
            bo.write(buf, 0, n);
        }
        in.close();
        return new String(bo.toByteArray(), StandardCharsets.UTF_8);
    }

    private class Bridge {
        @JavascriptInterface
        public String saveFile(String name, String text) {
            String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    v.put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream");
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + SUBDIR);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) {
                        return "Не удалось сохранить файл";
                    }
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        out.write(bytes);
                    }
                } else {
                    if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                            != PackageManager.PERMISSION_GRANTED) {
                        runOnUiThread(() -> requestPermissions(
                                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 2));
                        return "Разрешите доступ к памяти и нажмите «Сохранить» ещё раз";
                    }
                    File dir = new File(Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_DOWNLOADS), SUBDIR);
                    if (!dir.exists() && !dir.mkdirs()) {
                        return "Не удалось создать папку Download/" + SUBDIR;
                    }
                    try (OutputStream out = new FileOutputStream(new File(dir, safe))) {
                        out.write(bytes);
                    }
                }
                return "Сохранено: Загрузки/" + SUBDIR + "/" + safe;
            } catch (Exception e) {
                return "Ошибка сохранения: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public String shareImage(String b64, String mime, String text) {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.putExtra(Intent.EXTRA_TEXT, text);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, "chertezh_" + System.currentTimeMillis() + ".jpg");
                    v.put(MediaStore.Images.Media.MIME_TYPE, mime);
                    v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + SUBDIR);
                    Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                    if (uri != null) {
                        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                            out.write(bytes);
                        }
                        send.setType(mime);
                        send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    } else {
                        send.setType("text/plain");
                    }
                } else {
                    send.setType("text/plain");
                }
                final Intent ch = Intent.createChooser(send, "Отправить в Claude");
                runOnUiThread(() -> startActivity(ch));
                return Build.VERSION.SDK_INT >= 29
                        ? "Выберите приложение Claude."
                        : "Выберите приложение Claude и приложите фото чертежа вручную.";
            } catch (Exception e) {
                return "Не удалось отправить: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public void vision(final String key, final String model, final String prompt,
                           final String b64, final String mime, final String cb) {
            new Thread(() -> {
                String res;
                boolean ok = false;
                try {
                    JSONObject src = new JSONObject();
                    src.put("type", "base64");
                    src.put("media_type", mime);
                    src.put("data", b64);
                    JSONObject img = new JSONObject();
                    img.put("type", "image");
                    img.put("source", src);
                    JSONObject txt = new JSONObject();
                    txt.put("type", "text");
                    txt.put("text", prompt);
                    JSONArray content = new JSONArray();
                    content.put(img);
                    content.put(txt);
                    JSONObject msg = new JSONObject();
                    msg.put("role", "user");
                    msg.put("content", content);
                    JSONArray msgs = new JSONArray();
                    msgs.put(msg);
                    JSONObject body = new JSONObject();
                    body.put("model", model);
                    body.put("max_tokens", 8000);
                    body.put("messages", msgs);

                    HttpURLConnection c = (HttpURLConnection) new URL("https://api.anthropic.com/v1/messages").openConnection();
                    c.setRequestMethod("POST");
                    c.setDoOutput(true);
                    c.setConnectTimeout(30000);
                    c.setReadTimeout(240000);
                    c.setRequestProperty("content-type", "application/json");
                    c.setRequestProperty("x-api-key", key);
                    c.setRequestProperty("anthropic-version", "2023-06-01");
                    try (OutputStream o = c.getOutputStream()) {
                        o.write(body.toString().getBytes(StandardCharsets.UTF_8));
                    }
                    int code = c.getResponseCode();
                    String s = readAll(code < 400 ? c.getInputStream() : c.getErrorStream());
                    if (code < 400) {
                        JSONArray arr = new JSONObject(s).getJSONArray("content");
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < arr.length(); i++) {
                            JSONObject part = arr.getJSONObject(i);
                            if ("text".equals(part.optString("type"))) {
                                sb.append(part.optString("text"));
                            }
                        }
                        res = sb.toString();
                        ok = true;
                    } else {
                        String m = s;
                        try {
                            m = new JSONObject(s).getJSONObject("error").optString("message", s);
                        } catch (Exception ignored) {
                        }
                        res = (code == 401 ? "неверный ключ API" : "ошибка " + code) + ": " + m;
                    }
                } catch (Exception e) {
                    res = "нет связи или ошибка: " + e.getMessage();
                }
                final String js = "window.__vision&&window.__vision(" + JSONObject.quote(cb) + "," + ok + "," + JSONObject.quote(res) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }
    }
}
