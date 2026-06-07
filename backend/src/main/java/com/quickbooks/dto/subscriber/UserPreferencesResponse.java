package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;

public class UserPreferencesResponse {

    private AppTheme theme;
    private AppFontSize fontSize;

    public static UserPreferencesResponse of(AppTheme theme, AppFontSize fontSize) {
        UserPreferencesResponse response = new UserPreferencesResponse();
        response.setTheme(theme);
        response.setFontSize(fontSize);
        return response;
    }

    public AppTheme getTheme() { return theme; }
    public void setTheme(AppTheme theme) { this.theme = theme; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
}
