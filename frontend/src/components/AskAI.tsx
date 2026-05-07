import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { askAI } from '../api/ai';
import { colors } from '../theme/colors';

type Props = { airdropId: string };

const SUGGESTIONS = ['이 에어드랍 안전한가요?', '참여 자격이 어떻게 되나요?', '예상 보상 규모는?'];

export default function AskAI({ airdropId }: Props) {
  const [q, setQ] = useState('');
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (question: string) => {
    if (!question.trim()) return;
    setLoading(true);
    setErr(null);
    setA(null);
    try {
      const ans = await askAI(airdropId, question);
      setA(ans);
    } catch (e: any) {
      setErr('AI 응답에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>AI에게 물어보기</Text>
      <View style={styles.suggestRow}>
        {SUGGESTIONS.map((s) => (
          <Pressable key={s} onPress={() => submit(s)} style={styles.chip} android_ripple={{ color: colors.accentSoft }}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="이 에어드랍에 대해 궁금한 점을 입력하세요"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.send, !q.trim() && styles.sendDisabled]}
          onPress={() => submit(q)}
          disabled={!q.trim() || loading}
          android_ripple={{ color: '#fff3' }}
        >
          <Text style={styles.sendText}>전송</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.answerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : err ? (
        <Text style={styles.error}>{err}</Text>
      ) : a ? (
        <View style={styles.answerBox}>
          <Text style={styles.answer}>{a}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  send: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
  answerBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answer: { color: colors.text, fontSize: 14, lineHeight: 22 },
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
});
