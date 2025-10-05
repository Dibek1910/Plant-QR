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
      // Display HTML with line breaks
      this.plant.descriptionHtml = this.plant.description.replace(/\n/g, '<br>');

      // Prepare TTS-friendly text with natural pauses
      this.plant.ttsText = this.plant.description
        .replace(/\n/g, '. ')        // line breaks → pause
        .replace(/;/g, ',')          // semicolon → comma
        .replace(/Family:/g, 'Family,')
        .replace(/Origin:/g, 'Origin,')
        .replace(/Growth Habit:/g, 'Growth Habit,')
        .replace(/Light Required:/g, 'Light Required,')
        .replace(/Water Required:/g, 'Water Required,')
        .replace(/Soil Condition:/g, 'Soil Condition,')
        .replace(/Uses:/g, 'Uses,');

      this.isLoading = false;
    } else {
      this.error = 'Plant not found';
      this.isLoading = false;
    }
  }

  async speak(lang: string) {
    if (!this.plant) return;

    // Stop previous speech
    speechSynthesis.cancel();
    this.isPaused = false;

    let textToSpeak = this.plant.ttsText;

    // Translate if not English
    if (lang !== 'en-IN') {
      const targetLang = this.getLanguageCode(lang);
      textToSpeak = await this.translateText(this.plant.ttsText, targetLang);
    }

    this.utterance = new SpeechSynthesisUtterance(textToSpeak);
    this.utterance.lang = lang;

    // Select a more human-like voice if available
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang === lang && v.name.includes('Neural')) || voices.find(v => v.lang === lang);
    if (selectedVoice) {
      this.utterance.voice = selectedVoice;
    }

    // Make voice slower and more natural
    this.utterance.rate = 0.85;  // slightly slower
    this.utterance.pitch = 1.0;  // natural pitch

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
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }
}
