import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import type {
  ExperimentTrialRecord,
  TranslationHistoryItem,
} from '../src/types/signbridge.ts';
import { buildBaselineExperimentTrials } from './researchData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'signbridge.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_FILE);

  db.exec(`
    CREATE TABLE IF NOT EXISTS experiment_trials (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      signer_split TEXT NOT NULL,
      lighting_condition TEXT NOT NULL,
      mode TEXT NOT NULL,
      expected_sentence_ar TEXT NOT NULL,
      predicted_sentence_ar TEXT NOT NULL,
      raw_glosses_json TEXT NOT NULL,
      confidence_pct REAL NOT NULL,
      precision_score REAL NOT NULL,
      recall_score REAL NOT NULL,
      wer_pct REAL NOT NULL,
      latency_ms INTEGER NOT NULL,
      rejected_as_uncertain INTEGER NOT NULL,
      correct_prediction INTEGER NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS translation_history (
      id TEXT PRIMARY KEY,
      glosses_json TEXT NOT NULL,
      raw_literal_ar TEXT NOT NULL,
      contextual_sentence_ar TEXT NOT NULL,
      confidence_pct REAL NOT NULL,
      rejected_as_uncertain INTEGER NOT NULL,
      lighting_lux_estimate REAL NOT NULL,
      latency_ms INTEGER NOT NULL,
      signer_mode TEXT NOT NULL,
      consent_confirmed INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM experiment_trials').get() as {
    cnt: number;
  };
  if (countRow.cnt === 0) {
    seedExperimentTrials(db);
  }

  dbInstance = db;
  return db;
}

function seedExperimentTrials(db: DatabaseSync): void {
  const baseline = buildBaselineExperimentTrials();
  const insert = db.prepare(`
    INSERT INTO experiment_trials (
      id, experiment_id, signer_id, signer_split, lighting_condition, mode,
      expected_sentence_ar, predicted_sentence_ar, raw_glosses_json,
      confidence_pct, precision_score, recall_score, wer_pct, latency_ms,
      rejected_as_uncertain, correct_prediction, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const trial of baseline) {
    insert.run(
      trial.id,
      trial.experimentId,
      trial.signerId,
      trial.signerSplit,
      trial.lightingCondition,
      trial.mode,
      trial.expectedSentenceAr,
      trial.predictedSentenceAr,
      JSON.stringify(trial.rawGlosses),
      trial.confidencePct,
      trial.precisionScore,
      trial.recallScore,
      trial.werPct,
      trial.latencyMs,
      trial.rejectedAsUncertain ? 1 : 0,
      trial.correctPrediction ? 1 : 0,
      trial.timestamp,
    );
  }
}

export function listExperimentTrials(): ExperimentTrialRecord[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM experiment_trials ORDER BY timestamp DESC')
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    experimentId: row.experiment_id as ExperimentTrialRecord['experimentId'],
    signerId: String(row.signer_id),
    signerSplit: row.signer_split as ExperimentTrialRecord['signerSplit'],
    lightingCondition: row.lighting_condition as ExperimentTrialRecord['lightingCondition'],
    mode: row.mode as ExperimentTrialRecord['mode'],
    expectedSentenceAr: String(row.expected_sentence_ar),
    predictedSentenceAr: String(row.predicted_sentence_ar),
    rawGlosses: JSON.parse(String(row.raw_glosses_json)) as string[],
    confidencePct: Number(row.confidence_pct),
    precisionScore: Number(row.precision_score),
    recallScore: Number(row.recall_score),
    werPct: Number(row.wer_pct),
    latencyMs: Number(row.latency_ms),
    rejectedAsUncertain: Boolean(row.rejected_as_uncertain),
    correctPrediction: Boolean(row.correct_prediction),
    timestamp: String(row.timestamp),
  }));
}

export function insertExperimentTrial(trial: ExperimentTrialRecord): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO experiment_trials (
      id, experiment_id, signer_id, signer_split, lighting_condition, mode,
      expected_sentence_ar, predicted_sentence_ar, raw_glosses_json,
      confidence_pct, precision_score, recall_score, wer_pct, latency_ms,
      rejected_as_uncertain, correct_prediction, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trial.id,
    trial.experimentId,
    trial.signerId,
    trial.signerSplit,
    trial.lightingCondition,
    trial.mode,
    trial.expectedSentenceAr,
    trial.predictedSentenceAr,
    JSON.stringify(trial.rawGlosses),
    trial.confidencePct,
    trial.precisionScore,
    trial.recallScore,
    trial.werPct,
    trial.latencyMs,
    trial.rejectedAsUncertain ? 1 : 0,
    trial.correctPrediction ? 1 : 0,
    trial.timestamp,
  );
}

export function resetExperimentTrials(): ExperimentTrialRecord[] {
  const db = getDb();
  db.exec('DELETE FROM experiment_trials');
  seedExperimentTrials(db);
  return listExperimentTrials();
}

export function listTranslationHistory(): TranslationHistoryItem[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM translation_history ORDER BY created_at DESC')
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    glosses: JSON.parse(String(row.glosses_json)) as string[],
    rawLiteralAr: String(row.raw_literal_ar),
    contextualSentenceAr: String(row.contextual_sentence_ar),
    confidencePct: Number(row.confidence_pct),
    rejectedAsUncertain: Boolean(row.rejected_as_uncertain),
    lightingLuxEstimate: Number(row.lighting_lux_estimate),
    latencyMs: Number(row.latency_ms),
    signerMode: row.signer_mode as TranslationHistoryItem['signerMode'],
    consentConfirmed: Boolean(row.consent_confirmed),
    createdAt: String(row.created_at),
  }));
}

export function insertTranslationHistory(item: TranslationHistoryItem): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO translation_history (
      id, glosses_json, raw_literal_ar, contextual_sentence_ar,
      confidence_pct, rejected_as_uncertain, lighting_lux_estimate,
      latency_ms, signer_mode, consent_confirmed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    JSON.stringify(item.glosses),
    item.rawLiteralAr,
    item.contextualSentenceAr,
    item.confidencePct,
    item.rejectedAsUncertain ? 1 : 0,
    item.lightingLuxEstimate,
    item.latencyMs,
    item.signerMode,
    item.consentConfirmed ? 1 : 0,
    item.createdAt,
  );
}

export function deleteTranslationHistoryById(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM translation_history WHERE id = ?').run(id);
  return result.changes > 0;
}

export function clearAllTranslationHistory(): void {
  const db = getDb();
  db.exec('DELETE FROM translation_history');
}
