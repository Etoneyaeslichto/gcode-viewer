package ru.cnc.naryady;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final int PICK_FILE = 1;
    private static final String SUBDIR = "Naryady";
    private static final String APK = "application/vnd.android.package-archive";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private long updateId = -1;

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

    private void startUpdate(String url) {
        if (updateId != -1) {
            return;
        }
        try {
            new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk").delete();
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            r.setTitle(getString(R.string.app_name));
            r.setDescription("Обновление");
            r.setMimeType(APK);
            r.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "update.apk");
            updateId = ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
            ui.post(this::pollUpdate);
        } catch (Exception e) {
            updateId = -1;
            report("err", e.getMessage());
        }
    }

    // Прогресс загрузки обновления; по готовности — системное окно установки
    private void pollUpdate() {
        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        try (Cursor c = dm.query(new DownloadManager.Query().setFilterById(updateId))) {
            if (c == null || !c.moveToFirst()) {
                updateId = -1;
                report("err", "загрузка отменена");
                return;
            }
            int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                Uri uri = dm.getUriForDownloadedFile(updateId);
                updateId = -1;
                report("i", "Подтвердите установку");
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, APK);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(i);
                return;
            }
            if (status == DownloadManager.STATUS_FAILED) {
                updateId = -1;
                report("err", "не удалось скачать");
                return;
            }
            long done = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
            long total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            report("p", String.valueOf(total > 0 ? done * 100 / total : 0));
        } catch (Exception e) {
            updateId = -1;
            report("err", e.getMessage());
            return;
        }
        ui.postDelayed(this::pollUpdate, 500);
    }

    private void report(String state, String value) {
        web.evaluateJavascript("window.updProgress&&updProgress(" + JSONObject.quote(state) + ","
                + JSONObject.quote(value == null ? "" : value) + ")", null);
    }

    private class Bridge {
        @JavascriptInterface
        public void installUpdate(String url) {
            if (url != null && url.startsWith("https://")) {
                runOnUiThread(() -> startUpdate(url));
            }
        }

        @JavascriptInterface
        public String getVersion() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null || !url.startsWith("https://")) {
                return;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
            }
        }

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
    }
}
