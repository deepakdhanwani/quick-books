package com.quickbooks.dto.subscriber;

import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;
import jakarta.validation.constraints.NotNull;

public class UpdateUserPreferencesRequest {

    @NotNull
    private AppTheme theme;

    @NotNull
    private AppFontSize fontSize;

    public AppTheme getTheme() { return theme; }
    public void setTheme(AppTheme theme) { this.theme = theme; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
}
