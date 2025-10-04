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
  plant: any;
  utterance: SpeechSynthesisUtterance | null = null;
  isPaused = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.plant = plantsData.find(p => p.id === id);

    if (this.plant) {
      this.plant.descriptionHtml = this.plant.description.replace(/\n/g, '<br>');
    }
  }

  async speak(lang: string) {
    if (!this.plant) return;

    // Stop any previous speech
    speechSynthesis.cancel();
    this.isPaused = false;

    let textToSpeak = this.plant.description;

    // Translate if not English
    if (lang !== 'en-IN') {
      const targetLang = this.getLanguageCode(lang);
      textToSpeak = await this.translateText(this.plant.description, targetLang);
    }

    this.utterance = new SpeechSynthesisUtterance(textToSpeak);
    this.utterance.lang = lang;
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
    switch(lang) {
      case 'hi-IN': return 'hi';
      case 'de-DE': return 'de';
      case 'fr-FR': return 'fr';
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
