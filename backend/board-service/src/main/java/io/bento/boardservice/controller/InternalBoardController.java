package io.bento.boardservice.controller;

import io.bento.boardservice.repository.BoardMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/boards")
@RequiredArgsConstructor
public class InternalBoardController {

    private final BoardMemberRepository boardMemberRepository;

    @GetMapping("/{boardId}/member-ids")
    public ResponseEntity<List<String>> getBoardMemberIds(@PathVariable UUID boardId) {
        List<String> memberIds = boardMemberRepository.findAllByBoard_Id(boardId)
                .stream()
                .map(member -> member.getUserId().toString())
                .toList();
        return ResponseEntity.ok(memberIds);
    }
}
