package io.bento.orgservice.controller;

import io.bento.orgservice.repository.OrganizationMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
public class InternalOrgController {

    private final OrganizationMemberRepository memberRepository;

    @GetMapping("/orgs/user/{userId}")
    public List<Map<String, Object>> getUserOrgs(@PathVariable UUID userId) {
        return memberRepository.findAllByUserId(userId).stream()
                .map(m -> Map.<String, Object>of(
                        "orgId", m.getOrganization().getId(),
                        "orgName", m.getOrganization().getName(),
                        "orgSlug", m.getOrganization().getSlug(),
                        "orgRole", m.getOrgRole().name(),
                        "logoUrl", m.getOrganization().getLogoUrl() != null ? m.getOrganization().getLogoUrl() : ""
                ))
                .toList();
    }
}
