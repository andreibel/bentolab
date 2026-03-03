package io.bento.orgservice.controller;

import io.bento.orgservice.dto.request.UpdateMemberRoleRequest;
import io.bento.orgservice.dto.response.MemberResponse;
import io.bento.orgservice.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orgs/{orgId}/members")
public class MemberController {
    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<List<MemberResponse>> getMembers(
            @RequestHeader("X-User-Id") UUID userid,
            @PathVariable UUID orgId) {
        return ResponseEntity.ok(memberService.getAllOrgMember(userid, orgId));
    }

    @PatchMapping("{userId}/role")
    public ResponseEntity<MemberResponse> updateMembersRole(
            @RequestHeader("X-User-Id") UUID adminUserId,
            @PathVariable UUID userId,
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateMemberRoleRequest roleRequest) {
        return ResponseEntity.ok(memberService.updateMemberRole(adminUserId, userId, orgId, roleRequest));
    }


}

