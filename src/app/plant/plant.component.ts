import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import plantsData from '../../assets/plants.json';

@Component({
  selector: 'app-plant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.scss']
})
export class PlantComponent implements OnInit {
  plant: any = null;
  isLoading = true;
  error: string | null = null;
  voices: SpeechSynthesisVoice[] = [];
  utterance: SpeechSynthesisUtterance | null = null;
  isPaused = false;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    // Load voices
    speechSynthesis.onvoiceschanged = () => {
      this.voices = speechSynthesis.getVoices();
    };

    const id = this.route.snapshot.paramMap.get('id');
    this.plant = plantsData.find(p => p.id === id);

    if (this.plant) {
      // Format description with HTML line breaks
      this.plant.descriptionHtml = this.plant.description.replace(/\n/g, '<br>');

      // Use 'details' for TTS only
      this.plant.ttsText = this.stripHtml(this.plant.details)
        .replace(/\n/g, '. ')
        .replace(/;/g, ',')
        .trim();

      this.isLoading = false;
    } else {
      this.error = 'Plant not found';
      this.isLoading = false;
    }
  }

  // Strip HTML tags
  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  async speak(lang: string) {
    if (!this.plant) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();
    this.isPaused = false;

    let textToSpeak = this.plant.ttsText;

    // Add natural pauses for smoother rhythm
    textToSpeak = textToSpeak
      .replace(/, /g, ', ... ')
      .replace(/\. /g, '. ... ');

    // Translate if needed
    if (lang !== 'en-IN') {
      const targetLang = this.getLanguageCode(lang);
      textToSpeak = await this.translateText(this.plant.ttsText, targetLang);
    }

    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(textToSpeak);
    this.utterance.lang = lang;

    // Load voices (may be async)
    const voices = speechSynthesis.getVoices();

    // Smart voice selection for most natural tones
    const preferredVoices = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira Desktop - English (United States)',
      'Microsoft David Desktop - English (United States)',
      'Google हिन्दी', // Hindi
      'Google Deutsch', // German
      'Google Français', // French
      'Google русский'  // Russian
    ];

    let selectedVoice =
      voices.find(v => v.lang === lang && preferredVoices.includes(v.name)) ||
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(lang.split('-')[0]));

    if (selectedVoice) {
      this.utterance.voice = selectedVoice;
    }

    // 🎵 More natural settings
    this.utterance.rate = 0.88; // Slightly slower, more expressive
    this.utterance.pitch = 1.02; // Softer, less robotic tone
    this.utterance.volume = 1.0; // Full clarity

    // Add slight random pauses for natural breathing
    this.utterance.onboundary = (event) => {
      if (event.name === 'sentence') {
        const randPause = Math.random() * 200 + 100;
        speechSynthesis.pause();
        setTimeout(() => speechSynthesis.resume(), randPause);
      }
    };

    // Speak
    speechSynthesis.speak(this.utterance);
  }

  pauseSpeech() {
    if (!this.utterance) return;

    if (!this.isPaused) {
      speechSynthesis.pause();
      this.isPaused = true;
    } else {
      speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  stopSpeech() {
    speechSynthesis.cancel();
    this.isPaused = false;
  }

  getLanguageCode(lang: string) {
    switch (lang) {
      case 'hi-IN': return 'hi';   // Hindi
      case 'de-DE': return 'de';   // German
      case 'fr-FR': return 'fr';   // French
      case 'ru-RU': return 'ru';   // Russian
      default: return 'en';
    }
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }
}
