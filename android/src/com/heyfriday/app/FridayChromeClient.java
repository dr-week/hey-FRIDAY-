package com.heyfriday.app;

import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;

public class FridayChromeClient extends WebChromeClient {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        if (request != null && request.getResources() != null) {
            request.grant(request.getResources());
        }
    }
}
