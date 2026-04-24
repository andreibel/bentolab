package io.bento.boardservice.repository;

import io.bento.boardservice.entity.Label;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class LabelRepositoryTest {

    @Autowired
    private LabelRepository labelRepository;

    private final UUID ORG_A = UUID.randomUUID();
    private final UUID ORG_B = UUID.randomUUID();

    private Label buildLabel(UUID orgId, String name, String color) {
        return Label.builder()
                .orgId(orgId)
                .name(name)
                .color(color)
                .build();
    }

    // =========================================================================
    // Basic CRUD
    // =========================================================================

    @Test
    void save_persistsLabelWithGeneratedId() {
        Label saved = labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(saved.getId()).isNotNull();
        assertThat(labelRepository.findById(saved.getId())).isPresent();
    }

    @Test
    void save_setsDefaultValues() {
        Label saved = labelRepository.save(buildLabel(ORG_A, "Feature", "#00FF00"));

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getDescription()).isNull();
    }

    @Test
    void save_withDescription_storesDescription() {
        Label saved = labelRepository.save(Label.builder()
                .orgId(ORG_A)
                .name("Critical")
                .color("#FF0000")
                .description("High severity issues")
                .build());

        assertThat(saved.getDescription()).isEqualTo("High severity issues");
    }

    @Test
    void delete_removesLabel() {
        Label saved = labelRepository.save(buildLabel(ORG_A, "To Delete", "#000000"));

        labelRepository.deleteById(saved.getId());

        assertThat(labelRepository.findById(saved.getId())).isEmpty();
    }

    // =========================================================================
    // findAllByOrgId
    // =========================================================================

    @Test
    void findAllByOrgId_returnsLabelsForThatOrg() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));
        labelRepository.save(buildLabel(ORG_A, "Feature", "#00FF00"));
        labelRepository.save(buildLabel(ORG_B, "Task", "#0000FF"));

        List<Label> result = labelRepository.findAllByOrgId(ORG_A);

        assertThat(result).hasSize(2)
                .allMatch(l -> l.getOrgId().equals(ORG_A));
    }

    @Test
    void findAllByOrgId_unknownOrg_returnsEmptyList() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.findAllByOrgId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findAllByOrgId_noLabels_returnsEmptyList() {
        assertThat(labelRepository.findAllByOrgId(ORG_A)).isEmpty();
    }

    // =========================================================================
    // findByOrgIdAndId
    // =========================================================================

    @Test
    void findByOrgIdAndId_existingLabel_returnsLabel() {
        Label saved = labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        Optional<Label> result = labelRepository.findByOrgIdAndId(ORG_A, saved.getId());

        assertThat(result).isPresent()
                .get()
                .extracting(Label::getName)
                .isEqualTo("Bug");
    }

    @Test
    void findByOrgIdAndId_wrongOrgId_returnsEmpty() {
        Label saved = labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.findByOrgIdAndId(ORG_B, saved.getId())).isEmpty();
    }

    @Test
    void findByOrgIdAndId_unknownLabelId_returnsEmpty() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.findByOrgIdAndId(ORG_A, UUID.randomUUID())).isEmpty();
    }

    // =========================================================================
    // existsByOrgIdAndName
    // =========================================================================

    @Test
    void existsByOrgIdAndName_existingLabel_returnsTrue() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.existsByOrgIdAndName(ORG_A, "Bug")).isTrue();
    }

    @Test
    void existsByOrgIdAndName_unknownName_returnsFalse() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.existsByOrgIdAndName(ORG_A, "Feature")).isFalse();
    }

    @Test
    void existsByOrgIdAndName_sameNameDifferentOrg_returnsFalse() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThat(labelRepository.existsByOrgIdAndName(ORG_B, "Bug")).isFalse();
    }

    // =========================================================================
    // Constraints
    // =========================================================================

    @Test
    void save_duplicateOrgIdAndName_throwsDataIntegrityViolation() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));

        assertThatThrownBy(() -> labelRepository.saveAndFlush(buildLabel(ORG_A, "Bug", "#00FF00")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_sameNameDifferentOrg_succeeds() {
        labelRepository.save(buildLabel(ORG_A, "Bug", "#FF0000"));
        Label saved = labelRepository.saveAndFlush(buildLabel(ORG_B, "Bug", "#FF0000"));

        assertThat(saved.getId()).isNotNull();
    }
}
