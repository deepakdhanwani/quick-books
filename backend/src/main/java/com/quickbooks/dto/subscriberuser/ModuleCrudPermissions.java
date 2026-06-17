package com.quickbooks.dto.subscriberuser;

public class ModuleCrudPermissions {

    private boolean view;
    private boolean create;
    private boolean edit;
    private boolean delete;

    public static ModuleCrudPermissions full() {
        ModuleCrudPermissions permissions = new ModuleCrudPermissions();
        permissions.setView(true);
        permissions.setCreate(true);
        permissions.setEdit(true);
        permissions.setDelete(true);
        return permissions;
    }

    public static ModuleCrudPermissions none() {
        return new ModuleCrudPermissions();
    }

    public boolean any() {
        return view || create || edit || delete;
    }

    public boolean getView() { return view; }
    public void setView(boolean view) { this.view = view; }
    public boolean getCreate() { return create; }
    public void setCreate(boolean create) { this.create = create; }
    public boolean getEdit() { return edit; }
    public void setEdit(boolean edit) { this.edit = edit; }
    public boolean getDelete() { return delete; }
    public void setDelete(boolean delete) { this.delete = delete; }
}
