package io.bento.boardservice.service;

import io.bento.boardservice.dto.request.CreateLabelRequest;
import io.bento.boardservice.dto.request.UpdateLabelRequest;
import io.bento.boardservice.dto.response.LabelResponse;
import io.bento.boardservice.entity.Label;
import io.bento.boardservice.exception.BoardAccessDeniedException;
import io.bento.boardservice.exception.LabelNotFoundException;
import io.bento.boardservice.mapper.LabelMapper;
import io.bento.boardservice.repository.LabelRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LabelServiceTest {

    @Mock private LabelRepository labelRepository;
    @Mock private LabelMapper labelMapper;
    @Mock private BoardAccessService boardAccessService;

    @InjectMocks private LabelService labelService;

    private static final UUID ORG_ID   = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID LABEL_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private Label buildLabel(String name, String color) {
        return Label.builder()
                .id(LABEL_ID)
                .orgId(ORG_ID)
                .name(name)
                .color(color)
                .createdAt(Instant.now())
                .build();
    }

    private LabelResponse buildLabelResponse(UUID id, String name, String color) {
        return new LabelResponse(id, ORG_ID, name, color, null, Instant.now());
    }

    // =========================================================================
    // getLabels
    // =========================================================================

    @Test
    void getLabels_delegatesToRepositoryAndMapsResults() {
        Label label = buildLabel("Bug", "#FF0000");
        LabelResponse response = buildLabelResponse(LABEL_ID, "Bug", "#FF0000");
        when(labelRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of(label));
        when(labelMapper.toResponse(label)).thenReturn(response);

        List<LabelResponse> result = labelService.getLabels(ORG_ID);

        assertThat(result).containsExactly(response);
    }

    @Test
    void getLabels_noLabels_returnsEmptyList() {
        when(labelRepository.findAllByOrgId(ORG_ID)).thenReturn(List.of());

        assertThat(labelService.getLabels(ORG_ID)).isEmpty();
    }

    // =========================================================================
    // createLabel
    // =========================================================================

    @Test
    void createLabel_orgAdmin_savesLabelAndReturnsResponse() {
        Label saved = buildLabel("Feature", "#00FF00");
        LabelResponse response = buildLabelResponse(LABEL_ID, "Feature", "#00FF00");
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.save(any(Label.class))).thenReturn(saved);
        when(labelMapper.toResponse(saved)).thenReturn(response);

        LabelResponse result = labelService.createLabel(ORG_ID, "ORG_ADMIN",
                new CreateLabelRequest("Feature", "#00FF00", null));

        assertThat(result).isEqualTo(response);
    }

    @Test
    void createLabel_orgAdmin_savesLabelWithCorrectFields() {
        Label saved = buildLabel("Task", "#0000FF");
        when(boardAccessService.isOrgAdmin("ORG_OWNER")).thenReturn(true);
        when(labelRepository.save(any(Label.class))).thenReturn(saved);
        when(labelMapper.toResponse(any())).thenReturn(buildLabelResponse(LABEL_ID, "Task", "#0000FF"));

        labelService.createLabel(ORG_ID, "ORG_OWNER",
                new CreateLabelRequest("Task", "#0000FF", "A task label"));

        ArgumentCaptor<Label> captor = ArgumentCaptor.forClass(Label.class);
        verify(labelRepository).save(captor.capture());
        Label persisted = captor.getValue();
        assertThat(persisted.getOrgId()).isEqualTo(ORG_ID);
        assertThat(persisted.getName()).isEqualTo("Task");
        assertThat(persisted.getColor()).isEqualTo("#0000FF");
        assertThat(persisted.getDescription()).isEqualTo("A task label");
    }

    @Test
    void createLabel_notOrgAdmin_throwsAccessDenied() {
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);

        assertThatThrownBy(() ->
                labelService.createLabel(ORG_ID, "ORG_MEMBER",
                        new CreateLabelRequest("Bug", "#FF0000", null)))
                .isInstanceOf(BoardAccessDeniedException.class);

        verify(labelRepository, never()).save(any());
    }

    // =========================================================================
    // updateLabel
    // =========================================================================

    @Test
    void updateLabel_orgAdmin_updatesAndReturnsResponse() {
        Label label = buildLabel("Old Name", "#000000");
        LabelResponse response = buildLabelResponse(LABEL_ID, "New Name", "#FFFFFF");
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.of(label));
        when(labelRepository.save(label)).thenReturn(label);
        when(labelMapper.toResponse(label)).thenReturn(response);

        LabelResponse result = labelService.updateLabel(ORG_ID, "ORG_ADMIN", LABEL_ID,
                new UpdateLabelRequest("New Name", "#FFFFFF", null));

        assertThat(result).isEqualTo(response);
        assertThat(label.getName()).isEqualTo("New Name");
        assertThat(label.getColor()).isEqualTo("#FFFFFF");
    }

    @Test
    void updateLabel_nullName_doesNotOverwriteExistingName() {
        Label label = buildLabel("Keep Name", "#000000");
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.of(label));
        when(labelRepository.save(label)).thenReturn(label);
        when(labelMapper.toResponse(any())).thenReturn(buildLabelResponse(LABEL_ID, "Keep Name", "#FF0000"));

        labelService.updateLabel(ORG_ID, "ORG_ADMIN", LABEL_ID,
                new UpdateLabelRequest(null, "#FF0000", null));

        assertThat(label.getName()).isEqualTo("Keep Name");
    }

    @Test
    void updateLabel_blankName_doesNotOverwriteExistingName() {
        Label label = buildLabel("Keep Name", "#000000");
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.of(label));
        when(labelRepository.save(label)).thenReturn(label);
        when(labelMapper.toResponse(any())).thenReturn(buildLabelResponse(LABEL_ID, "Keep Name", "#FF0000"));

        labelService.updateLabel(ORG_ID, "ORG_ADMIN", LABEL_ID,
                new UpdateLabelRequest("   ", "#FF0000", null));

        assertThat(label.getName()).isEqualTo("Keep Name");
    }

    @Test
    void updateLabel_notOrgAdmin_throwsAccessDenied() {
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);

        assertThatThrownBy(() ->
                labelService.updateLabel(ORG_ID, "ORG_MEMBER", LABEL_ID,
                        new UpdateLabelRequest("New", "#FF0000", null)))
                .isInstanceOf(BoardAccessDeniedException.class);

        verifyNoInteractions(labelRepository);
    }

    @Test
    void updateLabel_labelNotFound_throwsLabelNotFoundException() {
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                labelService.updateLabel(ORG_ID, "ORG_ADMIN", LABEL_ID,
                        new UpdateLabelRequest("New", "#FF0000", null)))
                .isInstanceOf(LabelNotFoundException.class);
    }

    // =========================================================================
    // deleteLabel
    // =========================================================================

    @Test
    void deleteLabel_orgAdmin_deletesLabel() {
        Label label = buildLabel("Bug", "#FF0000");
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.of(label));

        labelService.deleteLabel(ORG_ID, "ORG_ADMIN", LABEL_ID);

        verify(labelRepository).delete(label);
    }

    @Test
    void deleteLabel_notOrgAdmin_throwsAccessDenied() {
        when(boardAccessService.isOrgAdmin("ORG_MEMBER")).thenReturn(false);

        assertThatThrownBy(() ->
                labelService.deleteLabel(ORG_ID, "ORG_MEMBER", LABEL_ID))
                .isInstanceOf(BoardAccessDeniedException.class);

        verify(labelRepository, never()).delete(any());
    }

    @Test
    void deleteLabel_labelNotFound_throwsLabelNotFoundException() {
        when(boardAccessService.isOrgAdmin("ORG_ADMIN")).thenReturn(true);
        when(labelRepository.findByOrgIdAndId(ORG_ID, LABEL_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                labelService.deleteLabel(ORG_ID, "ORG_ADMIN", LABEL_ID))
                .isInstanceOf(LabelNotFoundException.class);

        verify(labelRepository, never()).delete(any());
    }
}
