package io.bento.taskservice.exception;

public class SavedFilterNotFoundException extends ResourceNotFoundException {
    public SavedFilterNotFoundException(String filterId) {
        super("Saved filter not found: " + filterId);
    }
}
